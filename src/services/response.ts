import chalk from 'chalk'
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
        const stream = r.stream
        const headers = r.headers.toObject()
        let $parsedBody: any = stream
        let $parseHint: PostmanCli.ResponsePrintable['$parseHint']

        if (!r.originalRequest) throw Error('request not found in response')
        const request = services.request.toPrintable(r.originalRequest)

        const type = contentType.parse(headers['content-type'])

        if (type.type.includes('json') && stream) {
            $parsedBody = JSON.parse(stream.toString())
            $parseHint = 'json'
        } else if (type.type.includes('text') && stream) {
            $parsedBody = stream.toString()
            $parseHint = 'text'
        }

        return {
            ...request,
            headers,
            body: stream,
            $parsedBody: $parsedBody,
            $parseHint,
            size: r.responseSize,
            time: r.responseTime,
            code: r.code,
            status: r.status,
        }
    }

    getPrintString(r: PostmanCli.ResponsePrintable): string {
        let result = '\n' + chalk.underline.bold('response')
        result += ' ' + this.getCodeIcon(r.code, r.status)

        if (r.$parseHint && ['json', 'text'].includes(r.$parseHint)) {
            r.body = r.$parsedBody
        }
        const opts = { ignore: ['$parseHint', '$parsedBody'] }
        result += '\n' + services.common.getFormattedObject(r, opts)

        return result
    }

    print(r: psdk.Response) {
        const printable = this.toPrintable(r)
        const printString = this.getPrintString(printable)
        services.logger.out(printString)
    }
}

export default new ResponseService()
