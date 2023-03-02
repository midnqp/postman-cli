import psdk from 'postman-collection'
import newman from 'newman'
import * as commander from 'commander'
import { PostmanCli } from '@src/types.js'
import services from '@src/services/index.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.Show, commander.Command]
) {
    const cmd = _cmd[1]
    args = args.map(e => e.toLowerCase())
    const co = await services.cmdopts.getOptCollection(cmd)
    if (services.common._.isError(co)) {
        services.logger.error(co.message)
        return
    }

    const resource = services.common.getNestedResource(co, args)
    if (services.common._.isError(resource)) {
        services.logger.error(resource.message)
        return
    }

    services.resource.print(resource)
}