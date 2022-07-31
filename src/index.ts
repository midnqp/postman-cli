import {Command} from 'commander'
import psdk from 'postman-collection'
import * as util from './util.js'

/**
 * @todo Output to stdout all data as JSON.
 * Curly braces' color be white.
 */
const program = new Command()
program
	.name('pcli')
	.description('postman command-line interface')
	.version('0.0.0')
program.option(
	'-c, --collection <string>',
	'path to postman collection'
)
program
	.command('show <shows...>')
	.description('show details of a resource')
	.option('--with-res <boolean>', 'include response')
	.action(cmdShow)
program
	.command('list [lists...]')
	.description('list resource heirarchy')
	.action(cmdList)
program.parse()

/**
 * Show example req data details.
 * @todo folder having requests & examples
 * @todo requests having examples
 * @kind command
 */
async function cmdShow (args: string[], ...cmd) {
	cmd = cmd[1]
	args = args.map(e => e.toLowerCase())
	const co = await util.getCollection(cmd)

	const resource = util.findRecurse(co, args)
	if (util._.isError(resource)) {
		util.logger.error(resource.message)
		return
	}
	const result:Array<string|Error> = []
	if (resource instanceof psdk.ItemGroup)
		resource.forEachItem(e => result.push(util.showDetails(e)))
	else result.push(util.showDetails(resource))

	result.forEach(output => {
		if (util._.isError(output)) return util.logger.error(output.message)
		util.logger.out(output)
	})
}

/**
 * @kind command
 */
async function cmdList (args: string[], ...cmd) {
	cmd = cmd[1]
	args = args.map(e => e.toLowerCase())
	const co = await util.getCollection(cmd)
	const names:any[] = []

	let parent:any = co
	/** Storage passed by address for listRecurse(). */
	let store = names
	
	if (args.length) {
		parent = util.findRecurse(co, args)
		if (util._.isError(parent)) {
			util.logger.error(parent.message)
			return
		}
	}
	if (parent.name) {
		const parentName = util.getInstanceSymbol(parent) + ` ${parent.name}`
		names.push([parentName])
		store=names[0]
	}
	
	if (util.isFolder(parent) || util.isColl(parent)) util.listRecurse(parent.items.all(), args, store)
	else if (util.isItem(parent)) util.listRecurse(parent.responses.all(), args, store)
	
	util.logger.out(util.showList(names))
}
