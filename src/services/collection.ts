import psdk from 'postman-collection'
import services from '@src/services/index.js'
import axios from 'axios'
import fs from 'fs-extra'
import chalk from 'chalk'
import { Command } from 'commander'

export class CollectionService {
    isCollection(value): value is psdk.Collection {
        return psdk.Collection.isCollection(value)
    }

    async save(cmd: Command, collection: psdk.Collection) {
        if (!cmd.parent) throw Error('cmd parent is null')

        const apikey = services.env.apiKey
        const hint = services.cmdopts.cachedCollectionHint
        const hintvalue = services.cmdopts.cachedCollectionHintValue

        switch (hint) {
            case 'none': {
                const err = [
                    'collection hint not found, ',
                    'fetch collection first',
                ].join('')
                throw Error(err)

                break
            }

            case 'file': {
                const path = hintvalue
                const string = JSON.stringify(collection, null, 2)
                await fs.writeFile(path, string)
                break
            }
            case 'url-readonly': {
                throw Error('readonly collections cannot be saved')
                break
            }
            case 'url': {
                const url = hintvalue

                const keyErr =
                    'postman api key required, ' +
                    'when collection is being saved'
                if (!apikey) throw Error(keyErr)

                try {
                    const opts = { headers: { 'X-API-Key': apikey } }
                    const response = await axios.put(url, { collection }, opts)
                    const axiosres = services.common.parseAxiosRes(response)
                    const object = services.common.getPrintedObject(axiosres)
                    services.logger.out(object)
                } catch (err: any) {
                    const e = [
                        'http request to save ',
                        'collection failed: ',
                        err.message,
                    ].join('')
                    throw Error(e)
                }
                break
            }
            case 'id': {
                const id = hintvalue

                const apikey = services.env.apiKey
                const errApikey =
                    'postman api key required, ' +
                    'when collection is being saved'
                if (!apikey) throw Error(errApikey)

                const opts = { headers: { 'X-API-Key': apikey } }
                const url = 'https://api.getpostman.com/collections/' + id
                try {
                    await axios.put(url, { collection }, opts)
                } catch (err: any) {
                    const e = [
                        'http request to save ',
                        'collection failed: ',
                        err.message,
                    ].join('')
                    throw Error(e)
                }

                break
            }
        }
    }

    getIcon() {
        return chalk.italic.magenta(' col ')
    }
}

export default new CollectionService()
