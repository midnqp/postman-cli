import * as commander from 'commander'
import { PostmanCli } from '@src/types.js'
import services from '@src/services/index.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.Delete, commander.Command]
) {
    const [optional, cmd] = _cmd
    const co = await services.cmdopts.getOptCollection(cmd)

    const item = services.common.getNestedResource(co, args)
    if (services.common._.isError(item)) {
        services.logger.error(item.message)
        return
    }
    const parent = item.parent()
    const children = services.resource.getChildren(parent, false)
    children.remove(e => e.id == item.id, {})
    await services.collection.saveChanges(cmd, co)
    services.resource.printOutline([parent])
}
