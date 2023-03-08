import { PostmanCli } from '@src/types.js'
import psdk from 'postman-collection'
import services from '@src/services/index.js'

/**
 * Mostly an abstraction over psdk.Response
 * for cmd-show.
 */
export class ExampleService {
    toPrintable(r: psdk.Response): PostmanCli.ExamplePrintable {
        let urlMethod = ''
        let urlPath = ''
        const resultResponse = services.response.toPrintable(r)
        let resultRequest: undefined | PostmanCli.RequestPrintable

        // cmd-show
        // postman examples usually are under a request
        // so examples have both request body + response body
        if (r.originalRequest) {
            resultRequest = services.request.toPrintable(r.originalRequest)
            urlMethod = r.originalRequest.method
            urlPath = r.originalRequest.url.getPath()
        }

        const item = r.parent() as psdk.Item
        if ((!urlMethod || !urlPath) && item) {
            urlMethod = item.request.method
            urlPath = item.request.url.getPath()
        }

        return { response: resultResponse, request: resultRequest }
    }

    getPrintString(r: PostmanCli.ExamplePrintable) {
        let req = ''
        if (r.request) req = services.request.getPrintString(r.request)
        const res = services.response.getPrintString(r.response)
        return req + '\n\n\n\n' + res
    }

    print(r: psdk.Response) {
        const printable = this.toPrintable(r)
        const string = this.getPrintString(printable)
        services.logger.out(string)
    }
}

export default new ExampleService()
