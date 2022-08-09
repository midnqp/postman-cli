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
	.version('0.0.0', '-v, --version')
	.helpOption('-h, --help')
program
	.option(
		'-c, --collection <string>',
		'path to postman collection'
	)
	.option('-H, --headers <string>', 'global header for all requests')
	.option('-V --variables <string>', 'Postman')
program
	.command('show <shows...>')
	.description('show details of a resource')
	.option('--with-res <boolean>', 'include response')
	.action(Cmd.show)
program
	.command('list [lists...]')
	.description('list resource heirarchy')
	.action(Cmd.list)
program
	.command('run [runs...]')
	.description('runs a request')
	.option('-r', 'include request details')
	.option('-m', 'include additional response details')
	.action(Cmd.run)
program.parse()
