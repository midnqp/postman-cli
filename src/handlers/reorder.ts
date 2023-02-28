import psdk from 'postman-collection'
import services from '@src/services/index.js'
import * as commander from 'commander'
import { PostmanCli } from '@src/types.js'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.Reorder, commander.Command]
) {
    const [optional, cmd] = _cmd
    const co = await services.cmdopts.getOptCollection(cmd)
    const resource = services.common.getNestedResource(co, args)
    if (services.common._.isError(resource)) {
        services.logger.error(resource.message)
        return
    }
    let optsIdx = parseInt(optional.index)

    const parent = resource.parent()
    const children: psdk.PropertyList<any> = services.resource.getChildren(
        parent,
        false
    )
    const length = children.count()
    optsIdx = optsIdx - 1 // it was 1-based index
    if (optsIdx >= length - 1) optsIdx = length - 1
    else if (optsIdx <= 0) optsIdx = 0

    if (length > 1) {
        const resIdx = children.indexOf(resource.id)
        // @ts-ignore
        services.common.arrayMove(children.members, resIdx, optsIdx)
        await services.collection.saveChanges(cmd, co)
    }
    services.resource.printOutline([parent])
}
