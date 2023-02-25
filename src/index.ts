import {Command} from 'commander'
import CmdHandler from '@src/handlers/index.js'


const program = new Command()
program.name('pcli')
	.description('postman command-line interface')
	.version('0.0.3', '--version')
	.helpOption('--help')

program
	.option('-c, --collection <string>', 'path to collection')
	.option('-h, --headers <string>', 'header for all requests')
	.option('-v, --variables <string>', 'variable for all requests')

program
	.command('show <resources...>')
	.description('show details of a resource')
	.action(CmdHandler.show)

program
	.command('list [resources...]')
	.description('list resources recursively')
	.option('-d [number]', 'max recursive depth', 'Infinity')
	.action(CmdHandler.list)

program
	.command('run <resources...>')
	.description('runs a request')
	.action(CmdHandler.run)

program
	.command('move')
	.description('move a resource under another parent')
	.requiredOption('--from <resources...>')
	.requiredOption('--to <resources...>')
	.action(CmdHandler.move)

program
	.command('rename <resources...>')
	.description('rename a resource')
	.requiredOption('--name <string>', 'new name of resource')
	.action(CmdHandler.rename)

program
	.command('delete <resources...>')
	.description('remove a resource')
	.action(CmdHandler.delete)

program
	.command('reorder <resources...>')
	.description('reorder a resource under the same parent')
	.requiredOption('--index <number>', 'new 1-based index')
	.action(CmdHandler.reorder)

program.parse()
