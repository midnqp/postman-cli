import './env.js'
import { Command } from 'commander'
import Cmd from './cmd.js'

/**
 * @todo Output to stdout all data as JSON.
 * Curly braces' color be white.
 */
const program = new Command()
program
	.name('pcli')
	.description('postman command-line interface')
	.version('0.0.1', '-v, --version')
	.helpOption('-h, --help')
program
	.option('-c, --collection <string>', 'path to collection')
	.option('-H, --headers <string>', 'header for all requests')
	.option('-V, --variables <string>', 'variable for all requests')
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
			'  $ pcli add -t request "new folder"	 # add request to folder'
		].join('\n')
	)
program
	.command('show <resources...>')
	.description('show details of a resource')
	.option('--res', 'include response')
	.option('--meta', 'include response meta')
	.action(Cmd.show)
program
	.command('list [resources...]')
	.description('list resources recursively')
	.option('-d [number]', 'set recursive depth [0]')
	.action(Cmd.list)
program
	.command('run <resources...>')
	.description('runs a request')
	.option('--req', 'include request')
	.option('--meta', 'include response meta')
	.action(Cmd.run)
program.command('run:edit [resources...]').description('edit and run a request')
program
	.command('list:edit [resources...]')
	.description('edit a list of resources')
	.option('-d [number]', 'set recursive depth [0]')
	.action(Cmd.listEdit)
program.command('search <resources...>').description('searches a resource')
program.parse()
