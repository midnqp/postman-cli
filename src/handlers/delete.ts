import * as commander from 'commander'
import { PostmanCli } from '@src/types.js'
import services from '@src/services/index.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.Delete, commander.Command]
) {
    const [optional, cmd] = _cmd
    const co = await services.cmdopts.getOptCollection(cmd)
    const item = services.resource.getFromNested(co, args)

    if (services.collection.isCollection(item))
        throw Error('cannot delete collection')

    const parent = item.parent() as PostmanCli.Containable
    if (!parent) throw Error('parent not found')

    const children = services.resource.getChildren(parent)
    children.remove(e => e.id == item.id, {})

    services.resource.printOutline([parent])
    await services.collection.save(cmd, co)
}
