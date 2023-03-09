import { PostmanCli } from '@src/types.js'
import psdk from 'postman-collection'
import services from '@src/services/index.js'

type ToPrintableOpts = {
    addParsedBody?: true
}

/**
 * Mostly an abstraction over psdk.Response
 * for cmd-show.
 */
export class ExampleService {
    declare ToPrintableOpts: ToPrintableOpts

    toPrintable(
        r: psdk.Response,
        opts: ToPrintableOpts = {}
    ): PostmanCli.ExamplePrintable {
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

        if (opts.addParsedBody && resultRequest?.$parsedBody) {
            resultRequest.body = resultRequest.$parsedBody
            delete resultRequest.$parsedBody
        }
        if (opts.addParsedBody && resultResponse?.$parsedBody) {
            resultResponse.body = resultResponse.$parsedBody
            delete resultResponse.$parsedBody
        }

        return { response: resultResponse, request: resultRequest }
    }

    getPrintString(r: PostmanCli.ExamplePrintable) {
        let req = ''
        if (r.request) req = services.request.getPrintString(r.request)
        const res = services.response.getPrintString(r.response)
        return req + '\n\n' + res
    }

    print(r: psdk.Response) {
        const printable = this.toPrintable(r)
        const string = this.getPrintString(printable)
        services.logger.out(string)
    }
}

export default new ExampleService()
