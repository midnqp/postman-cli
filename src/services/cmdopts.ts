import fs from 'fs-extra'
import services from '@src/services/index.js'
import { Command } from 'commander'
import * as uuid from 'uuid'
import psdk from 'postman-collection'
import axios from 'axios'
import path from 'node:path'

export class CmdOptsService {
    getOptVariables(cmd: Command) {
        if (!cmd.parent) throw Error('cmd.parent is null')

        const variables =
            cmd.parent.opts().variables || services.env.variables || '{}'
        return JSON.parse(variables)
    }

    #isCollectionId(id: string) {
        // id may begin with an integer
        const firstPart: string = id.split('-')[0]
        const num = Number(firstPart)
        if (Number.isInteger(num)) id = id.slice(firstPart.length + 1)

        if (path.extname(id).length) return false

        try {
            const u = new URL(id)
            return false
        } catch (err) {}

        return uuid.validate(id)
    }

    #isCollectionReadonlyUrl(url: string) {
        let u: URL
        try {
            u = new URL(url)
        } catch (err) {
            return false
        }
        const accessKey = u.searchParams.get('access_key')
        if (!accessKey) return false
        if (!accessKey.startsWith('PMAT')) return false
        if (u.host !== 'api.postman.com') return false
        if (!u.pathname.startsWith('/collections/')) return false

        return true
    }

    #isCollectionUrl(url: string) {
        let u: URL
        try {
            u = new URL(url)
        } catch (err) {
            return false
        }

        const accessKey = u.searchParams.get('access_key')
        if (accessKey) return false
        if (u.host !== 'api.postman.com') return false
        if (!u.pathname.startsWith('/collections/')) return false

        return true
    }

    async #isCollectionFile(path: string) {
        const exists = await services.common.fileExists(path)
        if (!exists) return false

        try {
            await fs.readJson(path)
            return true
        } catch (err) {
            return false
        }
    }

    async #getCollectionFetchHint(hint: string): Promise<CollectionHint> {
        if (await this.#isCollectionFile(hint)) return 'file'
        else if (this.#isCollectionReadonlyUrl(hint)) return 'url-readonly'
        else if (this.#isCollectionUrl(hint)) return 'url'
        else if (this.#isCollectionId(hint)) return 'id'
        return 'none'
    }

    async #fetchCollection(cmd: Command): Promise<Error | Record<string, any>> {
        if (!cmd.parent) return Error('cmd.parent is null')

        // precedence order
        const hintable =
            cmd.parent.opts().collection ||
            services.env.collectionFilepath ||
            services.env.collectionUrl ||
            ''
        const hint = await this.#getCollectionFetchHint(hintable)

        let collection: Record<string, any>

        switch (hint) {
            case 'none':
                return Error('no collection specified')
                break
            case 'file': {
                const file = hintable
                const co = await fs.readJson(file, 'utf8')
                collection = co
                if (co?.collection) collection = co.collection
                break
            }
            case 'id': {
                const id = hintable
                const apikey = services.env.apiKey
                const errApikey =
                    'postman api key required, ' +
                    'when collection id is specified'
                if (!apikey) return Error(errApikey)

                const opts = { headers: { 'X-API-Key': apikey } }
                const url = 'https://api.getpostman.com/collections/' + id
                try {
                    const { data } = await axios.get(url, opts)
                    collection = data.collection
                } catch (err: any) {
                    return Error('http request to fetch collection failed')
                }
                break
            }
            case 'url': {
                const url = hintable

                const apikey = services.env.apiKey
                const errApikey =
                    'postman api key required, ' +
                    'when collection url is specified'
                if (!apikey) return Error(errApikey)

                const opts = { headers: { 'X-API-Key': apikey } }
                try {
                    const { data } = await axios.get(url, opts)
                    collection = data.collection
                } catch (err: any) {
                    return Error('http request to fetch collection failed')
                }
                break
            }
            case 'url-readonly': {
                const url = hintable

                try {
                    const { data } = await axios.get(url)
                    collection = data.collection
                } catch (err: any) {
                    const e = 'http request to fetch readonly collection failed'
                    return Error(e)
                }
                break
            }
        }

        this.#cachedCollectionJson = collection
        this.cachedCollectionHint = hint
        this.cachedCollectionHintValue = hintable
        return collection
    }

    cachedCollectionHintValue = ''
    cachedCollectionHint: CollectionHint = 'none'
    #cachedCollectionJson: undefined | Record<string, any> = undefined

    async getOptCollection(
        cmd: Command,
        forceFetch = false
    ): Promise<Error | psdk.Collection> {
        let collection: Record<string, any> = {}

        if (!this.#cachedCollectionJson || forceFetch) {
            const c = await this.#fetchCollection(cmd)
            if (services.common._.isError(c)) return c

            collection = c
        } else collection = this.#cachedCollectionJson

        const result = new psdk.Collection(collection)
        return result
    }

    getOptHeaders(cmd: Command): psdk.Header[] {
        if (!cmd.parent) throw Error('cmd.parent is null')
        const headersString =
            cmd.parent.opts().headers || services.env.globalHeaders || '{}'
        const headers = JSON.parse(headersString)
        const result = Object.entries(headers).map(([k, v]) => {
            const value: string | any = v
            return new psdk.Header({ key: k, value, system: true })
        })
        return result
    }
}

type CollectionHint = 'file' | 'id' | 'url' | 'url-readonly' | 'none'

export default new CmdOptsService()
