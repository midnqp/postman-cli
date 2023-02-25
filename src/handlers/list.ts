import psdk from 'postman-collection'
import * as util from '@src/util.js'
import newman from 'newman'
import * as commander from 'commander'
import {PostmanCli} from '@src/types.js'

export default async function (args: PostmanCli.Cmd.VariadicResources, ..._cmd: [PostmanCli.Cmd.Opts.List, commander.Command]) {
	const [optional, cmd] = _cmd
	args = args.map(e => e.toLowerCase())
	const co = await util.getOptCollection(cmd)
	let initialparent: any = [co]

	if (args.length) {
		const res = util.getNestedResource(co, args)
		if (util._.isError(initialparent)) {
			util.logger.error(initialparent.message)
			return
		}
		initialparent = [res]
	}

	util.showResourceListRecur(initialparent, {d: optional.d})
}
