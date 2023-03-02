import chalk from 'chalk'
import contentType from 'content-type'
import psdk from 'postman-collection'
import services from '@src/services/index.js'
import { PostmanCli } from '@src/types'
import {method} from 'lodash'

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

    toPrintable(r: psdk.Response): PostmanCli.ResponsePrintable {
        const headers = r.headers.toObject()
        let $parseHint: PostmanCli.ResponsePrintable['$parseHint']
        let $parsedBody: any
        let rawBody: any

        //if (!r.originalRequest) throw Error('request not found in response')

        if (r?.originalRequest?.body) {
            // cmd-show
            const body = r.originalRequest?.body
            const mode = body.mode
            type ResponseLang = 'json' | 'text' | undefined
            // @ts-ignore
            const lang: ResponseLang = body.options[mode]?.language
            const raw = body[mode]
            rawBody = raw

            if (lang == 'json' && raw) {
                $parsedBody = r.json()
                $parseHint = 'json'
            } else if (lang == 'text' && raw) {
                $parsedBody = r.text()
                $parseHint = 'text'
            }
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
					method: r?.originalRequest?.method||'', 
					path: r?.originalRequest?.url.getPath() ||'' 
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
        let result = this.getCodeIcon(rr.code, rr.status)

        if (rr.$parseHint && ['json', 'text'].includes(rr.$parseHint)) {
            rr.body = rr.$parsedBody
        }
        const opts = ['$parseHint', '$parsedBody', 'code', 'status']
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
