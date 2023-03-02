import { promises as fs } from 'fs'
import chalk from 'chalk'
import psdk from 'postman-collection'
import axios from 'axios'
import env from '@src/services/env.js'
import services from '@src/services/index.js'
import { PostmanCli } from '@src/types.js'

export class ItemService {
    isItem(value): value is psdk.Item {
        return psdk.Item.isItem(value)
    }
}

export default new ItemService()
