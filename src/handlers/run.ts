import psdk from 'postman-collection'
import * as commander from 'commander'
import services from '@src/services/index.js'
import { PostmanCli } from '@src/types.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.List, commander.Command]
) {
    const [optional, cmd] = _cmd
    const globalVariables = services.cmdopts.getOptVariables(cmd)
    const globalHeaders = services.cmdopts.getOptHeaders(cmd)

    const co = await services.cmdopts.getOptCollection(cmd)
    if (services.common._.isError(co)) {
        services.logger.error(co.message)
        return
    }

    co.syncVariablesFrom(globalVariables)

    const resource = services.common.getNestedResource(co, args)
    if (services.common._.isError(resource)) {
        services.logger.error(resource.message)
        return
    }
    let runnable: any = resource
    const restoreOrigReq: {
        changed: boolean
        req?: any
        headers?: psdk.HeaderList
        prevreq?: any
        prevheaders: any[]
    } = { changed: false, prevheaders: [] }

    if (services.response.isResponse(resource)) {
        const runnableParent = resource.parent()
        if (runnableParent) {
            const item = runnableParent as psdk.Item
            const exampledata = resource?.originalRequest?.body?.raw || ''

            let prevreqdata: any
            if (item?.request?.body?.raw) {
                prevreqdata = item.request.body.raw
                item.request.body.raw = exampledata
            }
            runnable = item

            restoreOrigReq.changed = true
            restoreOrigReq.req = item?.request?.body
            restoreOrigReq.headers = item.request.headers
            restoreOrigReq.prevreq = prevreqdata
        }
    } else if (services.item.isItem(resource)) {
        let prevheaderdata: psdk.Header[] = []
        if (globalHeaders.length) {
            const all = runnable.request.headers.all()
            prevheaderdata = all
            globalHeaders.forEach(e => runnable.request.headers.upsert(e))
            restoreOrigReq.prevheaders = prevheaderdata
        }
    }

    try {
        const summ = await services.common.newmanRun({
            collection: co,
            folder: runnable.id,
        })
        const execs = summ.run.executions
        const fails = summ.run.failures

        execs.forEach(exec => {
            // @ts-ignore
            const { response, item: _item } = exec
            const item = _item as any
            if (!item || !response) return

            if (services.item.isItem(item)) {
                const opts: typeof services.request.PrintOpts = {
                    printableOpts: {
                        includeGlobalHeaders: true,
                        includeGlobalVariables: true,
                        headers: globalHeaders,
                        variables: globalVariables,
                    },
                }
                services.request.print(item.request, opts)
            } else if (services.resource.isResource(item))
                services.resource.print(item)
            services.logger.out('')
            services.resource.print(response)
        })

        fails.forEach(fail => {
            const resource = <PostmanCli.Resource | undefined>fail.source
            if (!resource) return
            services.logger.error(fail.error.message)

            if (services.resource.isResource(resource))
                services.resource.print(resource)
            else services.logger.warn('resource could not be printed')
        })
    } catch (err: any) {
        services.logger.error(err.message)
    }

    if (restoreOrigReq.changed) {
        restoreOrigReq.req.raw = restoreOrigReq.prevreq

        restoreOrigReq.prevheaders.forEach(h => {
            const { headers } = restoreOrigReq
            headers && headers.upsert(h)
        })
    }
}
