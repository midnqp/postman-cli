import chalk from 'chalk'
import prettyBytes from 'pretty-bytes'
import contentType from 'content-type'
import psdk from 'postman-collection'
import services from '@src/services/index.js'
import { PostmanCli } from '@src/types'

export class ResponseService {
    isResponse(value): value is psdk.Response {
        return psdk.Response.isResponse(value)
    }

    getIcon() {
        return chalk.italic.magenta(' res ')
    }

    getCodeIcon(code: number, status: string) {
        if (!code || !status) return ''

        let color = chalk
        switch (code.toString()[0]) {
            case '2':
                color = chalk.green
                break
            case '4':
            case '5':
                color = chalk.red
                break
            default:
                color = chalk.yellow
                break
        }
        return color(code + ' ' + status)
    }

    /**
     * recursively prepared nested Enquirer choices, if
     * json has nested objects.
     */
    toFormChoices(json, { result, parentName }: any): void {
        if (!parentName) parentName = ''

        if (services.common._.isPlainObject(json)) {
            Object.entries(json).forEach(([k, v]) => {
                if (services.common._.isPlainObject(v)) {
                    const nestedItem = {
                        name: k,
                        message: k,
                        type: 'form',
                        choices: [],
                    }
                    result.push(nestedItem)
                    return this.toFormChoices(v, {
                        parentName: k,
                        result: nestedItem.choices,
                    })
                }
                const sep = '⁣'
                const item = {
                    name: parentName ? parentName + sep + k : k,
                    message: k,
                    initial: v,
                }
                result.push(item)
            })
        }
    }

    /**
     * Transforms response body to
     */
    toEnquirerForm(r: psdk.Response): Error | any[] {
        const result: any[] = []

        const body = r?.originalRequest?.body
        if (!body || !r.originalRequest) return result

        const json = services.request.toJsonBody(r.originalRequest)
        if (services.common._.isError(json)) return json

        this.toFormChoices(json, { result })
        return result
    }

    toPrintable(r: psdk.Response): PostmanCli.ResponsePrintable {
        const headers = r.headers.toObject()
        let $parseHint: PostmanCli.ResponseParseHint = 'none'
        let $parsedBody: any
        let rawBody: any
        let urlMethod = ''
        let urlPath = ''

        //if (headers['content-type'] && r.stream) {
        // before cmd-run, and after cmd-run
        if (r.body || r.stream) {
            try {
                $parsedBody = JSON.parse(r.body || r.stream?.toString() || '{}')
                $parseHint = 'json'
            } catch (e) {
                const s = 'parsing only json request/response body is supported'
                throw Error(s)
            }
        }

        if (r.originalRequest) {
            urlMethod = r.originalRequest.method
            urlPath = r.originalRequest.url.getPath()
        }

        const parent = r.parent() as psdk.Item // this is undefined while in cmd-run!
        if ((!urlMethod || !urlPath) && parent) {
            // cmd-show
            urlMethod = parent.request.method
            urlPath = parent.request.url.getPath()
        }

        return {
            url: {
                method: urlMethod,
                path: urlPath,
            },
            headers,
            body: rawBody,
            $parsedBody,
            $parseHint,
            size: r.size() as any,
            time: r.responseTime,
            code: r.code,
            status: r.status,
        }
    }

    getPrintString(r: PostmanCli.ResponsePrintable): string {
        const rr = Object.assign({}, r)

        const avail = ['json', 'text'].includes(rr.$parseHint || '')
        if (avail) rr.body = rr.$parsedBody

        const opts = ['$parseHint', '$parsedBody', 'code', 'status', 'size']
        if (!rr.url.method || !rr.url.path) opts.push('url') // in cmd-run

        let result = this.getCodeIcon(rr.code, rr.status)
        result += '    ' + prettyBytes(rr.size.total)
        if (rr.time) {
            result += '    ' + rr.time + ' ms'
            opts.push('time')
        }
        result += '\n' + services.common.getFormattedObject(rr, opts)
        return result
    }

    print(r: psdk.Response) {
        const printable = this.toPrintable(r)
        const printString = this.getPrintString(printable)
        services.logger.out(printString)
    }
}

export default new ResponseService()
