import services from '@src/services/index.js'
import * as commander from 'commander'
import { PostmanCli } from '@src/types.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.Rename, commander.Command]
) {
    const [optional, cmd] = _cmd
    const co = await services.cmdopts.getOptCollection(cmd)

    const item = services.common.getNestedResource(co, args)
    if (services.common._.isError(item)) {
        services.logger.error(item.message)
        return
    }
    item.name = optional.name
    services.resource.printOutline([item?.parent() || co])
    services.collection.saveChanges(cmd, co)
}
