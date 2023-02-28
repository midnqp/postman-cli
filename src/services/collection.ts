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

    async saveChanges(cmd: Command, collection: psdk.Collection) {
        if (!cmd.parent) throw Error('cmd parent is null')

        const cmdOpt = cmd.parent.opts().collection
        const envFilepath = services.env.collectionFilepath
        const envUrl = services.env.collectionUrl
        const exportPath = cmdOpt || envFilepath

        if (exportPath) {
            const string = JSON.stringify(collection, null, 2)
            await fs.writeFile(exportPath, string)
        }

        if (envUrl) {
            const response = await axios.put(envUrl, collection)
            const axiosres = services.common.parseAxiosRes(response)
            const object = services.common.getPrintedObject(axiosres)
            services.logger.out(object)
        }
    }

    getIcon() {
        return chalk.italic(' COL ')
    }
}

export default new CollectionService()
