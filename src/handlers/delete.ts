import * as commander from 'commander'
import { PostmanCli } from '@src/types.js'
import services from '@src/services/index.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.Delete, commander.Command]
) {
    const [optional, cmd] = _cmd
    const co = await services.cmdopts.getOptCollection(cmd)
    if (services.common._.isError(co)) {
        services.logger.error(co.message)
        return
    }

    const item = services.resource.getFromNested(co, args)
    if (services.common._.isError(item)) {
        services.logger.error(item.message)
        return
    }
    if (services.collection.isCollection(item)) {
        services.logger.error('cannot delete collection')
        return
    }

    const parent = item.parent() as PostmanCli.Containable
    if (!parent) throw Error('parent not found')

    const children = services.resource.getChildren(parent)
    children.remove(e => e.id == item.id, {})

    services.resource.printOutline([parent])

    const saved = await services.collection.save(cmd, co)
    if (services.common._.isError(saved)) {
        services.logger.error(saved.message)
        return
    }
}
