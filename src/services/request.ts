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

    toPrintable(r: psdk.Request): PostmanCli.HttpPrintable {
        return {
            params: r.url.variables.toObject(),
            query: r.url.query.toObject(),
            body: JSON.parse(r.body?.raw || '{}'),
            url: {
                path: r.url.getPath({ unresolved: true }),
                method: r.method.toLowerCase(),
            },
            headers: r.headers.toObject(),
        }
    }

    getPrintString(printable: PostmanCli.HttpPrintable): string {
        let result =
            '\n' +
            this.getMethodIcon(printable.url.method) +
            ' ' +
            printable.url.path
        result += '\n' + services.common.getFormattedObject(printable, ['url'])
        return result
    }

    print(r: psdk.Request) {
        const printable = this.toPrintable(r)
        const printString = this.getPrintString(printable)
        services.logger.out(printString)
    }
}

export default new RequestService()
