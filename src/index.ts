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
	.command('add')
	.description('adds a new resource')
	//.option('-t <type>', 'type of resource, one of: folder, request, example [request]')
	.option('--parent <resources...>',  'parent of new resource')
	// TODO: take interactive prompts of input for this command
	// prompts: type, name, then... different fields based on `type`
program
	.command('show <resources...>')
	.description('show details of a resource')
	.option('--res', 'include example response body')
	.option('--info', 'include additional info, if available')
	.option('--compact', 'shorten response')
	.option('--hide <string>', 'hide comma-separated object paths')
	.option('-hl, --highlight <string>', 'highlight comma-separated object paths')
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
program
	.command('move')
	.option('--from <resources...>')
	.option('--to <resources...>')
	.description('move a resource under another parent')
	.action(Cmd.move)
program.command('quickrun [resources...]').description('edit and run a request, without saving changes')
program.command('rename <newname> <resources...>')
program.command('delete <resources...>')
program.command('reorder <resources...>').option('--index [number]', '1-based index')
program.command('simple').description('run any simple request')
.option('--url <string>')
.option('--method <string>').option('--data [string]').option('--headers [string]', 'headers as a json string')
program.command('update <resources...>')
program.command('workspace').description('manage workspaces')
program.command('env').description('manage environment variables')// represented as a big json
program
	.command('search <resources...>')
	.description('searches by name of resource')
	.option('-t <type>', 'type of resource, one of: folder, request, example [request]')

program.parse()
