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
program.parse()

/**
 * Show example req data details.
 * @todo folder having requests & examples
 * @todo requests having examples
 */
async function cmdShow (args: string[], ...cmd) {
	cmd = cmd[1]
	args = args.map(e => e.toLowerCase())
	const co = await util.getCollection(cmd)

	const resource = util.findRecurse(co, args)
	const result:Array<string|Error> = []
	if (resource instanceof psdk.ItemGroup)
		resource.forEachItem(e => result.push(util.showDetails(e)))
	else result.push(util.showDetails(resource))

	result.forEach(output => {
		if (util._.isError(output)) return util.logger.error(output.message)
		else return util.logger.out(output)
	})
}

async function cmdList (args: string[], ...cmd) {
	cmd = cmd[1]
	args = args.map(e => e.toLowerCase())
	const co = await util.getCollection(cmd)

	co.items.each(itemOrItemGr => {
		if (itemOrItemGr instanceof psdk.ItemGroup)
			itemOrItemGr.items.each(e => e.name)
	})	
}
