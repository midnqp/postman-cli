import psdk from 'postman-collection'
import * as util from '@src/util.js'
import newman from 'newman'
import * as commander from 'commander'
import {PostmanCli} from '@src/types.js'

export default async function (args: PostmanCli.Cmd.VariadicResources, ..._cmd: [PostmanCli.Cmd.Opts.Show, commander.Command]) {
	const cmd = _cmd[1]
	args = args.map(e => e.toLowerCase())
	const co = await util.getOptCollection(cmd)

	const resource = util.getNestedResource(co, args)
	if (util._.isError(resource)) {
		util.logger.error(resource.message)
		return
	}

	const result: Array<string | Error> = []
	if (util.isFolder(resource)) resource.forEachItem(e => result.push(util.showDetails(e)))
	else result.push(util.showDetails(resource))
	result.forEach(output => {
		if (util._.isError(output)) return util.logger.error(output.message)
		util.logger.out(output + '\n')
	})
}

