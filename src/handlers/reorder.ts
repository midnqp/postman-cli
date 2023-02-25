import psdk from 'postman-collection'
import * as util from '@src/util.js'
import newman from 'newman'
import * as commander from 'commander'
import {PostmanCli} from '@src/types.js'

export default async function (args: PostmanCli.Cmd.VariadicResources, ..._cmd: [PostmanCli.Cmd.Opts.Reorder, commander.Command]) {
	const [optional, cmd] = _cmd
	const co = await util.getOptCollection(cmd)
	const resource = util.getNestedResource(co, args)
	if (util._.isError(resource)) {
		util.logger.error(resource.message)
		return
	}
	let optsIdx = parseInt(optional.index)

	const parent = resource.parent()
	const children: psdk.PropertyList<any> = util.getChildren(parent, false)
	const length = children.count()
	optsIdx = optsIdx - 1 // it was 1-based index
	if (optsIdx >= length - 1) optsIdx = length - 1
	else if (optsIdx <= 0) optsIdx = 0

	if (length > 1) {
		// @ts-ignore
		util.arrayMove(children.members, children.indexOf(resource.id), optsIdx)
		await util.saveChanges(cmd, co)
	}
	util.showResourceListRecur([parent])
}
