import services from '@src/services/index.js'
import * as commander from 'commander'
import { PostmanCli } from '@src/types.js'

export default async function (
    args: PostmanCli.Cmd.Opts.Move,
    cmd: commander.Command
) {
    const co = await services.cmdopts.getOptCollection(cmd)

    const resourceFrom = services.resource.getFromNested(co, args.from)
    let resourceTo: PostmanCli.Resource | PostmanCli.Containable | Error
    if (args.to.length == 1 && args.to[0] == co.name) resourceTo = co
    else resourceTo = services.resource.getFromNested(co, args.to)

    const fromType = services.resource.getType(resourceFrom)
    const toType = services.resource.getType(resourceTo)
    if (!services.resource.isContainable(resourceTo)) {
        services.logger.error(toType + ' cannot contain a ' + fromType)
        return
    }

    const validDestinations = {
        folder: ['folder', 'collection'],
        request: ['folder', 'collection'],
        example: ['request'],
    }
    if (!validDestinations[fromType].includes(toType)) {
        services.logger.error(toType + ' cannot contain a ' + fromType)
        return
    }

    services.resource.setParent(resourceFrom, resourceTo)
    services.resource.printOutline([co])
    await services.collection.save(cmd, co)
}
