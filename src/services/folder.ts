import { promises as fs } from 'fs'
import chalk from 'chalk'
import psdk from 'postman-collection'
import axios from 'axios'
import env from '@src/services/env.js'
import services from '@src/services/index.js'

export class FolderService {
    isFolder(value): value is psdk.ItemGroup<any> {
        return psdk.ItemGroup.isItemGroup(value)
    }

    getIcon() {
        return chalk.italic(' FOL ')
    }
}

export default new FolderService()
