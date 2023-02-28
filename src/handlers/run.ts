import psdk from 'postman-collection'
import * as commander from 'commander'
import services from '@src/services/index.js'
import { PostmanCli } from '@src/types.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.List, commander.Command]
) {
    const [optional, cmd] = _cmd
    const variables = services.cmdopts.getOptVariables(cmd)
    const co = await services.cmdopts.getOptCollection(cmd)
    co.syncVariablesFrom(variables)

    const resource = services.common.getNestedResource(co, args)
    if (services.common._.isError(resource)) {
        services.logger.error(resource.message)
        return
    }
    let runnable: any = resource
    const restoreOrigReq: any = {
        changed: false,
        req: undefined,
        prevreqdata: undefined,
    }

    if (services.response.isResponse(resource)) {
        const tmp = resource.parent()
        if (tmp) {
            const item = tmp as psdk.Item
            const exampledata = resource?.originalRequest?.body?.raw || ''

            let prevreqdata
            if (item?.request?.body?.raw) {
                prevreqdata = item.request.body.raw
                item.request.body.raw = exampledata
            }
            runnable = item

            restoreOrigReq.changed = true
            restoreOrigReq.req = item?.request?.body
            restoreOrigReq.prevreqdata = prevreqdata
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

            services.request.print(item)
            services.response.print(response)
        })

        fails.forEach(fail => {
            const resource = <PostmanCli.Resource | undefined>fail.source
            if (!resource) return
            services.logger.error(fail.error.message)

            if (services.request.isRequest(resource))
                services.request.print(resource)
            else services.logger.warn(resource.name + ' not printed')
        })
    } catch (err: any) {
        services.logger.error(err.message)
    }

    if (restoreOrigReq.changed)
        restoreOrigReq.req.raw = restoreOrigReq.prevreqdata
}
