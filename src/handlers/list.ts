import * as commander from 'commander'
import psdk from 'postman-collection'
import services from '@src/services/index.js'
import { PostmanCli } from '@src/types.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.List, commander.Command]
) {
    const [optional, cmd] = _cmd
    args = args.map(e => e.toLowerCase())
    const co = await services.cmdopts.getOptCollection(cmd)
    let parent: [psdk.Collection] | [PostmanCli.Resource] = [co]

    if (args.length) {
        const res = services.common.getNestedResource(co, args)
        if (services.common._.isError(res)) {
            services.logger.error(res.message)
            return
        }
        parent = [res]
    }

    services.resource.printOutline(parent, { d: optional.d })
}
