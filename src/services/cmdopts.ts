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

    async getOptCollection(cmd: commander.Command) {
        if (!cmd.parent) throw Error('cmd.parent is null')

        // either filepath or uuid
        const filepath =
            cmd.parent.opts().collection || services.env.collectionFilepath
        const foundFile = await services.common.fileExists(filepath)

        let collection: psdk.Collection

        if (filepath && foundFile) {
            const co = await fs.readJson(filepath, 'utf8')
            collection = co
            if (co?.collection) collection = co.collection
        } else if (
            !filepath &&
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
            filepath &&
            !foundFile &&
            uuid.validate(filepath) &&
            services.env.apiKey
        ) {
            const axiosopts = { headers: { 'X-API-Key': services.env.apiKey } }
            const url = 'https://api.getpostman.com/collections/' + filepath
            const { data } = await axios.get(url, axiosopts)
            collection = data.collection
        } else {
            throw Error('no collection found')
        }

        const result = new psdk.Collection(collection)
        return result
    }

    getOptHeaders(cmd: commander.Command) {
        if (!cmd.parent) throw Error('cmd.parent is null')
    }
}

export default new CmdOptsService()
