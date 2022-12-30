import './env.js'
import { Command } from 'commander'
import Cmd from './cmd.js'

/**
 * @todo Output to stdout all data as JSON.
 * Curly braces' color be white.
 */
const program = new Command()
program.name('pcli').description('postman command-line interface').version('0.0.1', '--version').helpOption('--help')
program
	.option('-c, --collection <string>', 'path to collection')
	.option('-h, --headers <string>', 'header for all requests')
	.option('-v, --variables <string>', 'variable for all requests')
program
	.command('add <resources...>')
	.description('adds a new resource')
	.option('-t <type>', 'type of resource, one of: folder, request, example [request]')
	.addHelpText(
		'afterAll',
		[
			'',
			'Example:',
			'  $ pcli add -t folder  # add folder to collection',
			'  $ pcli add -t request "new folder"	 # add request to folder',
		].join('\n')
	)
program
	.command('show <resources...>')
	.description('show details of a resource')
	.option('--res', 'include response body')
	.option('--info', 'include response info')
	.action(Cmd.show)
program
	.command('list [resources...]')
	.description('list resources recursively')
	.option('-d [number]', 'set max recursion depth [0]')
	.action(Cmd.list)
program
	.command('run <resources...>')
	.description('runs a request')
	.option('--req', 'include request')
	.option('--info', 'include response info')
	.action(Cmd.run)
program.command('run:edit [resources...]').description('edit and run a request, without saving changes')
program
	.command('list:edit [resources...]')
	.description('edit a list of resources')
	.option('-d [number]', 'set recursive depth [0]')
	.action(Cmd.listEdit)
program
	.command('search <resources...>')
	.description('searches by name of resource')
	.option('-t <type>', 'type of resource, one of: folder, request, example [request]')

program.parse()
