import psdk from 'postman-collection'
import services from '@src/services/index.js'
import * as commander from 'commander'
import { PostmanCli } from '@src/types.js'

// pcli move --from resources... --to resources...
// notice that `pcli move` isn't variadic.
// it has options, which are variadic.
export default async function (
    args: PostmanCli.Cmd.Opts.Move,
    cmd: commander.Command
) {
    const co = await services.cmdopts.getOptCollection(cmd)
    if (services.common._.isError(co)) {
        services.logger.error(co.message)
        return
    }

    const resourceFrom = services.common.getNestedResource(co, args.from)
    if (services.common._.isError(resourceFrom)) {
        services.logger.error(resourceFrom.message)
        return
    }
    let resourceTo: PostmanCli.Resource | PostmanCli.Containable | Error
    if (args.to.length == 1 && args.to[0] == co.name) resourceTo = co
    else {
        resourceTo = services.common.getNestedResource(co, args.to)
        if (services.common._.isError(resourceTo)) {
            services.logger.error(resourceTo.message)
            return
        }
    }
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
    const saved = await services.collection.save(cmd, co)
    if (services.common._.isError(saved)) {
        services.logger.error(saved.message)
        return
    }
}
