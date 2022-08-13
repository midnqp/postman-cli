import './env.js'
import {Command} from 'commander'
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
	.option(
		'-c, --collection <string>',
		'path to collection'
	)
	.option('-H, --headers <string>', 'header for all requests')
	.option('-V, --variables <string>', 'variable for all requests')
program
	.command('show <shows...>')
	.description('show details of a resource')
	//.option('-s', 'include response')
	.action(Cmd.show)
program
	.command('list [resources...]')
	.description('list resource heirarchy recursively')
	.option('-d [number]', 'set recursive depth [0]')
	.action(Cmd.list)
program
	.command('run [runs...]')
	.description('runs a request')
	//.option('-r', 'include request details')
	//.option('-s', 'include additional response details')
	.action(Cmd.run)
program.command('run:edit [resources...]').description('edit and run a request')
program
	.command('list:edit [resources...]')
	.description('edit a list of resources')
	.option('-d [number]', 'set recursive depth [0]')
	.option('--recurse', 'list and move items recursively')
	.action(Cmd.listEdit)
program
	.command('search [resources...]')
	.description('searches a resource')
program.parse()
