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

    const resource = services.resource.getFromNested(co, args)
    services.resource.print(resource)
}
