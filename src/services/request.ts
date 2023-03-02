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

    toPrintable(
        r: psdk.Request,
        opts: ToPrintableOpts = {}
    ): PostmanCli.HttpPrintable {
        const result: PostmanCli.HttpPrintable = {
            params: r.url.variables.toObject(),
            query: r.url.query.toObject(),
            body: JSON.parse(r.body?.raw || '{}'),
            url: {
                path: r.url.getPath({ unresolved: true }),
                method: r.method.toLowerCase(),
            },
            headers: r.headers.toObject(),
        }
        if (opts.includeGlobalHeaders && opts.headers) {
            const headers = opts.headers
            const headersJson = {}
            headers.forEach(h => {
                headersJson[h.key] = h.value
            })

            result['global-headers'] = headersJson
        }
        if (opts.includeGlobalVariables && opts.variables) {
            const variables = opts.variables
            result['global-variables'] = variables
        }

        return result
    }

    getPrintString(
        printable: PostmanCli.HttpPrintable,
        opts: GetPrintStringOpts = {}
    ): string {
        const icon = this.getMethodIcon(printable.url.method)
        const path = printable.url.path
        const obj = services.common.getFormattedObject(printable, ['url'])

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
