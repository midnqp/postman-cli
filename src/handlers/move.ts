import psdk from 'postman-collection'
import * as util from '@src/util.js'
import * as commander from 'commander'
import {PostmanCli} from '@src/types.js'

// pcli move --from resources... --to resources...
// notice that `pcli move` isn't variadic.
// it has options, which are variadic.
export default async function (args: PostmanCli.Cmd.Opts.Move, cmd: commander.Command) {
	const co = await util.getOptCollection(cmd)

	const resourceFrom = util.getNestedResource(co, args.from)
	if (util._.isError(resourceFrom)) {
		util.logger.error(resourceFrom.message)
		return
	}
	let resourceTo: PostmanCli.Resource | psdk.Collection | Error
	if (args.to.length == 1 && args.to[0] == 'collection') resourceTo = co
	else {
		resourceTo = util.getNestedResource(co, args.to)
		if (util._.isError(resourceTo)) {
			util.logger.error(resourceTo.message)
			return
		}
	}

	util.setParent(co, resourceTo, resourceFrom)
	util.showResourceListRecur([co])
	util.saveChanges(cmd, co)
}
