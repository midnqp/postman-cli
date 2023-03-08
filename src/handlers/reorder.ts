import services from '@src/services/index.js'
import * as commander from 'commander'
import { PostmanCli } from '@src/types.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.Reorder, commander.Command]
) {
    const [optional, cmd] = _cmd
    const co = await services.cmdopts.getOptCollection(cmd)

    const resource = services.resource.getFromNested(co, args)
    let optsIdx = parseInt(optional.index)

    const parent = resource.parent() as PostmanCli.Containable
    if (!parent) {
        services.logger.error('parent not found for ' + resource.name)
        return
    }

    const children = services.resource.getChildren(parent)
    const length = children.count()
    optsIdx = optsIdx - 1 // it was 1-based index
    if (optsIdx >= length - 1) optsIdx = length - 1
    else if (optsIdx <= 0) optsIdx = 0

    if (length > 1) {
        const resIdx = children.indexOf(resource.id)
        // @ts-ignore
        services.common.arrayMove(children.members, resIdx, optsIdx)
        services.resource.printOutline([parent])
        await services.collection.save(cmd, co)
    } else services.resource.printOutline([parent])
}
