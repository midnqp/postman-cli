import chalk from 'chalk'
import prettyBytes from 'pretty-bytes'
import contentType from 'content-type'
import psdk from 'postman-collection'
import services from '@src/services/index.js'
import { PostmanCli } from '@src/types'
import enquirer from 'enquirer'

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
        let $parseHint: PostmanCli.ResponseParseHint = 'text'
        let $parsedBody: any
        let rawBody: any
        let urlMethod = ''
        let urlPath = ''

        //if (!r.originalRequest) throw Error('request not found in response')

        if (r?.originalRequest?.body) {
            // cmd-show
            const body = r.originalRequest?.body
            const mode = <PostmanCli.ResponseParseHint>body.mode
            let lang: PostmanCli.ResponseLang
            // @ts-ignore
            lang = body.options[mode]?.language
            const raw = body[mode]
            rawBody = raw

            if (lang == 'json' && raw) {
                $parsedBody = r.json()
                $parseHint = 'json'
            } else if (lang == 'text' && raw) {
                $parsedBody = r.text()
                $parseHint = 'text'
            }

            urlMethod = r?.originalRequest?.method || ''
            urlPath = r?.originalRequest?.url.getPath() || ''
        } else if (headers['content-type'] && r.stream) {
            // cmd-run
            const { type } = contentType.parse(headers['content-type'])
            if (type.includes('json')) {
                $parseHint = 'json'
                $parsedBody = JSON.parse(r.stream.toString())
            } else if (type.includes('text')) {
                $parseHint = 'text'
                $parsedBody = r.stream.toString()
            }
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
        const rr = r

        if (rr.$parseHint && ['json', 'text'].includes(rr.$parseHint)) {
            rr.body = rr.$parsedBody
        }
        const opts = ['$parseHint', '$parsedBody', 'code', 'status', 'size']
        if (!r.url.method || !r.url.path) opts.push('url') // in cmd-run

        let result = this.getCodeIcon(rr.code, rr.status)
        result += '    ' + prettyBytes(rr.size.total)
        if (r.time) {
            result += '    ' + r.time + ' ms'
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
