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

    const resourceFrom = services.common.getNestedResource(co, args.from)
    if (services.common._.isError(resourceFrom)) {
        services.logger.error(resourceFrom.message)
        return
    }
    let resourceTo: PostmanCli.Resource | psdk.Collection | Error
    if (args.to.length == 1 && args.to[0] == co.name) resourceTo = co
    else {
        resourceTo = services.common.getNestedResource(co, args.to)
        if (services.common._.isError(resourceTo)) {
            services.logger.error(resourceTo.message)
            return
        }
    }

    services.resource.setParent(resourceFrom, resourceTo)
    services.resource.printOutline([co])
    services.collection.saveChanges(cmd, co)
}
