import { Command, Option } from 'commander'
import { PcliResource } from 'util.js'
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
	.command('show <resources...>')
	.description('show details of a resource')
	.option('--res', 'include example response body')
	.option('--info', 'include additional info, if available')
	.option('--nocompact', "don't hide longer responses")
	.option('--hide <string>', 'hide comma-separated object paths')
	.option('-hl, --highlight <string>', 'highlight comma-separated object paths')
	.action(Cmd.show)

program
	.command('list [resources...]')
	.description('list resources recursively')
	.option('-d [number]', 'set max recursion depth', 'Infinity')
	.action(Cmd.list)

program
	.command('run <resources...>')
	.description('runs a request')
	.option('--req', 'include request')
	.option('--info', 'include response info')
	.action(Cmd.run)

program
	.command('move')
	.requiredOption('--from <resources...>')
	.requiredOption('--to <resources...>')
	.description('move a resource under another parent')
	.action(Cmd.move)

program
	.command('rename <resources...>')
	.description('rename a resource')
	.requiredOption('--name <string>', 'new name of resource')
	.action(Cmd.rename)

program.command('delete <resources...>').description('remove a resource').action(Cmd.delete)
program
	.command('reorder <resources...>')
	.description('reorder a resource under the same parent')
	.requiredOption('--index <number>', 'new 1-based index')
	.action(Cmd.reorder)

program
	.command('add')
	.description('adds a new resource')
	.requiredOption('-t <type>', 'type of resource, one of: folder, request, example')
	.requiredOption('--name <string>', 'name of resource')
	.requiredOption('--parent <resources...>', 'parent of new resource')
	.option('--index [number]', '1-based index')
	.action(Cmd.add)
// TODO: take interactive prompts of input for this command
// prompts: type, name, then... different fields based on `type`

program.command('quickrun [resources...]').description('edit and run a request, without saving changes')
program
	.command('simple')
	.description('run any simple request')
	.requiredOption('--url <string>')
	.option('--method <string>', '', 'get')
	.option('--data [string]')
	.option('--headers [string]', 'headers as a json string')
program.command('update <resources...>')
program.command('env').description('manage environment variables') // represented as a big json

program
	.command('search <resources...>')
	.description('searches by name of resource')
	.option('-t <type>', 'type of resource, one of: folder, request, example', 'request')

program.parse()

export namespace PcliOpts {
	export type PcliResourceOr = 'request' | 'example' | 'folder'
	export type CmdVariadicResources = string[]
	/** `headers` and `variables` are json strings. */
	export type ProgramOpts = {
		collection: string
		headers?: string
		variables?: string
	}
	export type CmdShowOpts = {
		res?: true
		info?: true
		nocompact?: true
		hide?: string
		hl?: string
	}
	export type CmdListOpts = { d: number }
	export type CmdRunOpts = {
		req?: true
		info?: true
	}
	export type CmdMoveOpts = {
		from: CmdVariadicResources
		to: CmdVariadicResources
	}
	export type CmdRenameOpts = { name: string }
	export type CmdDeleteOpts = { index: number }
	export type CmdReorderOpts = {index:string}
	export type CmdAddOpts = {
		t: PcliResourceOr
		name: string
		parent: CmdVariadicResources
		index?: string
	}
	export type CmdSimpleOpts = {
		url?: string
		method?: string
		data?: string
		headers?: string
	}
	export type CmdSearchOpts = { t: PcliResourceOr }
	export type CmdAddRequestInput = {
		body: string
		method: 'get' | 'post' | 'put' | 'delete'
		url: string
		type: string
		headers: string
		query: string
		pathvar: string
	}
}
