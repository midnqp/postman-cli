import fs from 'fs-extra'
import services from '@src/services/index.js'
import commander from 'commander'
import * as uuid from 'uuid'
import psdk from 'postman-collection'
import axios from 'axios'

export class CmdOptsService {
    getOptVariables(cmd: commander.Command) {
        if (!cmd.parent) throw Error('cmd.parent is null')

        const variables =
            cmd.parent.opts().variables || services.env.variables || '{}'
        return JSON.parse(variables)
    }

    #isCollectionId(id: string) {
        const firstPart: string = id.split('-')[0]
        const num = Number(firstPart)
        if (Number.isInteger(num)) id = id.slice(firstPart.length + 1)
        return uuid.validate(id)
    }

    async getOptCollection(cmd: commander.Command) {
        if (!cmd.parent) throw Error('cmd.parent is null')

        // either filepath or uuid
        const idOrFile =
            cmd.parent.opts().collection || services.env.collectionFilepath
        const foundFile = await services.common.fileExists(idOrFile)

        let collection: psdk.Collection

        if (idOrFile && foundFile) {
            const co = await fs.readJson(idOrFile, 'utf8')
            collection = co
            if (co?.collection) collection = co.collection
        } else if (
            !idOrFile &&
            services.env.apiKey &&
            services.env.collectionUrl
        ) {
            const axiosopts = { headers: { 'X-API-Key': services.env.apiKey } }
            const { data } = await axios.get(
                services.env.collectionUrl,
                axiosopts
            )
            collection = data.collection
        } else if (
            idOrFile &&
            !foundFile &&
            this.#isCollectionId(idOrFile) &&
            services.env.apiKey
        ) {
            const axiosopts = { headers: { 'X-API-Key': services.env.apiKey } }
            const url = 'https://api.getpostman.com/collections/' + idOrFile
            const { data } = await axios.get(url, axiosopts)
            collection = data.collection
        } else {
            throw Error('no collection found')
        }

        const result = new psdk.Collection(collection)
        return result
    }

    getOptHeaders(cmd: commander.Command): psdk.Header[] {
        if (!cmd.parent) throw Error('cmd.parent is null')
        const headersString =
            cmd.parent.opts().headers || services.env.globalHeaders || '{}'
        const headers = JSON.parse(headersString)
        const result = Object.entries(headers).map(([k, v]) => {
            const value: string | any = v
            return new psdk.Header({ key: k, value, system: true })
        })
        console.log(result)
        return result
    }
}

export default new CmdOptsService()
