import psdk from 'postman-collection'
import * as util from '@src/util.js'
import * as commander from 'commander'
import {PostmanCli} from '@src/types.js'

export default async function (args: PostmanCli.Cmd.VariadicResources, ..._cmd: [PostmanCli.Cmd.Opts.Rename, commander.Command]) {
	const [optional, cmd] = _cmd
	const co = await util.getOptCollection(cmd)

	const item = util.getNestedResource(co, args)
	if (util._.isError(item)) {
		util.logger.error(item.message)
		return
	}
	item.name = optional.name
	util.showResourceListRecur([item?.parent() || co])
	util.saveChanges(cmd, co)
}
