import { PostmanCli } from '@src/types'
import chalk from 'chalk'
import psdk from 'postman-collection'
import services from '@src/services/index.js'

export class RequestService {
    isRequest(value): value is psdk.Request {
        return psdk.Request.isRequest(value)
    }
    getIcon() {
        return chalk.italic.magenta(' req ')
    }

    getBodyHint(req: psdk.Request): PostmanCli.ResponseParseHint {
        const body = req.body
        if (!body) return 'none'

        const mode = <PostmanCli.ResponseParseHint>body.mode
        // @ts-ignore
        const lang = body.options[mode]?.language

        if (lang) return lang
        return mode
    }

    /**
     * Parses any request body, and returns as JSON.
     */
    toJsonBody(req: psdk.Request): Record<string, any> | string | Error {
        const hint = this.getBodyHint(req)

        if (hint == 'json') return JSON.parse(req?.body?.raw || '{}')
        else if (hint == 'text') return req?.body?.raw || ''
        return Error('could not parse request body')
    }

    getMethodIcon(method: string): string {
        method = method.toUpperCase()
        let color = chalk
        switch (method) {
            case 'GET':
                color = chalk.green
                break
            case 'POST':
                color = chalk.yellow
                break
            case 'PUT':
                color = chalk.blue
                break
            case 'DELETE':
                color = chalk.red
                method = method.slice(0, 3)
                break
            default:
                break
        }
        return color(method.toLowerCase())
    }

    getRawBody() {
        // for binary file return <binary>
        // for wav file return <audio>
        // for image file return <image>
        //
        // for formdata return as json
        // TODO
        throw Error('not implemented')
    }

    toPrintable(
        r: psdk.Request,
        opts: ToPrintableOpts = {}
    ): PostmanCli.RequestPrintable {
        let $parsedBody: Record<string, any>
        let $parseHint: PostmanCli.ResponseParseHint = 'none'
        try {
            $parsedBody = JSON.parse(r.body?.raw || '{}')
            $parseHint = 'json'
        } catch (e) {
            const str = 'parsing only json request/response body is supported'
            throw Error(str)
        }

        const result: PostmanCli.RequestPrintable = {
            params: r.url.variables.toObject(),
            query: r.url.query.toObject(),
            body: r.body?.raw,
            url: {
                path: r.url.getPath({ unresolved: true }),
                method: r.method.toLowerCase(),
            },
            headers: r.headers.toObject(),
            $parsedBody,
            $parseHint,
        }
        if (opts.includeGlobalHeaders && opts.headers) {
            const headers = opts.headers
            const headersJson = {}
            headers.forEach(h => {
                headersJson[h.key] = h.value
            })

            result['global:headers'] = headersJson
        }
        if (opts.includeGlobalVariables && opts.variables) {
            const variables = opts.variables
            result['global:variables'] = variables
        }

        return result
    }

    getPrintString(
        r: PostmanCli.RequestPrintable,
        opts: GetPrintStringOpts = {}
    ): string {
        const rr = Object.assign({}, r)
        const avail = ['json', 'text'].includes(rr.$parseHint || '')
        if (avail) rr.body = rr.$parsedBody

        const icon = this.getMethodIcon(rr.url.method)
        const path = rr.url.path
        const ignore = ['url', '$parseHint', '$parsedBody']
        const obj = services.common.getFormattedObject(rr, ignore)

        let result = '\n' + icon + ' ' + path
        result += '\n' + obj
        return result
    }

    print(r: psdk.Request, opts: PrintOpts = {}) {
        const printable = this.toPrintable(r, {
            ...(opts.printableOpts && opts.printableOpts),
        })
        const printString = this.getPrintString(printable, {
            ...(opts.printStringOpts && opts.printStringOpts),
        })
        services.logger.out(printString)
    }

    declare ToPrintableOpts: ToPrintableOpts
    declare GetPrintStringOpts: GetPrintStringOpts
    declare PrintOpts: PrintOpts
}

type ToPrintableOpts = {
    includeGlobalHeaders?: boolean
    includeGlobalVariables?: boolean
    headers?: psdk.Header[]
    variables?: Record<string, string | number>
}

type GetPrintStringOpts = {}

type PrintOpts = {
    printableOpts?: ToPrintableOpts
    printStringOpts?: GetPrintStringOpts
}

export default new RequestService()
