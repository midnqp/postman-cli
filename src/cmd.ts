import psdk from 'postman-collection'
import * as util from './util.js'
import newman from 'newman'
import * as commander from 'commander'
import enquirer from 'enquirer'
import { PcliOpts, PcliResource } from './typings.js'

/**
 * Promisified `newman.run`.
 * @throws Error
 */
function newmanRun(options: newman.NewmanRunOptions): Promise<newman.NewmanRunSummary> {
	return new Promise((resl, rejc) => {
		newman.run(options, (err, summary) => {
			if (err) rejc(err)
			resl(summary)
		})
	})
}

export default class {
	static async add(args: PcliOpts.CmdAddOpts, cmd: commander.Command) {
		const co = await util.getOptCollection(cmd)
		let argsIdx = -1
		if (args.index) argsIdx = parseInt(args.index)

		const validtypes = ['folder', 'request', 'example']
		if (!validtypes.includes(args.t)) {
			const validstr = validtypes.join(', ').toString()
			util.logger.error('resource type needs to be one of: ' + validstr)
			return
		}

		const resParent = util.getNestedResource(co, args.parent)
		if (util._.isError(resParent)) {
			util.logger.error(resParent.message)
			return
		}

		if (args.t == 'folder') {
			if (!util.isColl(resParent)) {
				util.logger.error('when adding a folder, parent must be a collection or folder')
				return
			}
			const ch = util.getChildren(resParent, false)
			const folder = new psdk.ItemGroup({ name: args.name, item: [] })
			ch.add(folder)
			if (argsIdx != -1) util.arrayMove(ch.members, ch.indexOf(folder.id), argsIdx - 1)
		} else if (args.t == 'request') {
			if (!util.isColl(resParent) || !util.isFolder(resParent)) {
				util.logger.error('when adding a request, parent must be a collection or folder')
				return
			}

			const input: PcliOpts.CmdAddRequestInput = await enquirer.prompt({
				type: 'form',
				name: 'requestFields',
				message: 'specify request',
				choices: [
					{ name: 'method', initial: 'get' },
					{ name: 'url', initial: '{{server}}' },
					{ name: 'type', message: 'type', initial: 'json' },
					{ name: 'headers', initial: '{}' },
					{ name: 'query', initial: '{}' },
					{
						name: 'pathvar',
						message: 'path variables',
						initial: '{}',
					},
					{ name: 'body', initial: '{}', value:'{}' },
				],
			})

			const item= new psdk.Item({name: args.name, request: {
				url: input.url,
				method: input.method,
				body: {
					mode:input.type, 
					raw: util.toJsonString( input.body)
				}
			}})
			resParent.items.add(item)
			// TODO test
		}

		//util.saveChanges(cmd, co)
		util.showResourceListRecur([resParent])
	}

	static async reorder(args: PcliOpts.CmdVariadicResources, ..._cmd: [PcliOpts.CmdReorderOpts, commander.Command]) {
		const [optional, cmd] = _cmd
		const co = await util.getOptCollection(cmd)
		const resource = util.getNestedResource(co, args)
		if (util._.isError(resource)) {
			util.logger.error(resource.message)
			return
		}
		let optsIdx = parseInt(optional.index)

		const parent = resource.parent()
		const children: psdk.PropertyList<any> = util.getChildren(parent, false)
		const length = children.count()
		optsIdx = optsIdx - 1 // it was 1-based index
		if (optsIdx >= length - 1) optsIdx = length - 1
		else if (optsIdx <= 0) optsIdx = 0

		if (length > 1) {
			// @ts-ignore
			util.arrayMove(children.members, children.indexOf(resource.id), optsIdx)
			await util.saveChanges(cmd, co)
		}
		util.showResourceListRecur([parent])
	}

	/**
	 * Show request body, query, path variables,
	 * headers, and few details.
	 * @todo folder having requests & examples
	 * @todo requests having examples
	 * @kind command
	 */
	static async show(args: PcliOpts.CmdVariadicResources, ..._cmd: [PcliOpts.CmdShowOpts, commander.Command]) {
		const cmd = _cmd[1]
		args = args.map(e => e.toLowerCase())
		const co = await util.getOptCollection(cmd)

		// resource
		const resource = util.getNestedResource(co, args)
		if (util._.isError(resource)) {
			util.logger.error(resource.message)
			return
		}

		// output
		const result: Array<string | Error> = []
		if (util.isFolder(resource)) resource.forEachItem(e => result.push(util.showDetails(e)))
		else result.push(util.showDetails(resource))
		result.forEach(output => {
			if (util._.isError(output)) return util.logger.error(output.message)
			util.logger.out(output + '\n')
		})
	}

	static async list(args: PcliOpts.CmdVariadicResources, ..._cmd: [PcliOpts.CmdListOpts, commander.Command]) {
		const [optional, cmd] = _cmd
		args = args.map(e => e.toLowerCase())
		const co = await util.getOptCollection(cmd)
		let initialparent: any = [co]

		if (args.length) {
			const res = util.getNestedResource(co, args)
			if (util._.isError(initialparent)) {
				util.logger.error(initialparent.message)
				return
			}
			initialparent = [res]
		}

		util.showResourceListRecur(initialparent, { d: optional.d })
	}

	static async run(args: PcliOpts.CmdVariadicResources, ..._cmd: [PcliOpts.CmdListOpts, commander.Command]) {
		const [optional, cmd] = _cmd
		const variables = util.getOptVariables(cmd)
		const co = await util.getOptCollection(cmd)
		co.syncVariablesFrom(variables)

		const resource = util.getNestedResource(co, args)
		if (util._.isError(resource)) {
			util.logger.error(resource.message)
			return
		}
		let runnable: any = resource
		let restoreOrigReq: any = {
			changed: false,
			req: undefined,
			prevreqdata: undefined,
		}

		if (util.isResp(resource)) {
			const tmp = resource.parent()
			if (tmp) {
				let item = tmp as psdk.Item
				const exampledata = resource?.originalRequest?.body?.raw || ''

				let prevreqdata
				if (item?.request?.body?.raw) {
					prevreqdata = item.request.body.raw
					item.request.body.raw = exampledata
				}
				runnable = item

				restoreOrigReq.changed = true
				restoreOrigReq.req = item?.request?.body
				restoreOrigReq.prevreqdata = prevreqdata
			}
		}

		try {
			const summ = await newmanRun({ collection: co, folder: runnable.id })
			const execs = summ.run.executions
			const fails = summ.run.failures

			execs.forEach(exec => {
				// @ts-ignore
				const { response, item: _item } = exec
				const item = _item as any
				if (!item || !response) return

				const outRequest = util.showDetails(item)
				if (util._.isError(outRequest)) {
					util.logger.error(outRequest.message)
					return
				}
				util.logger.out(outRequest)

				const outResponse = util.showRespDetails(response, {
					compact: false,
					maxStringLength: undefined,
				})
				util.logger.out(outResponse)
			})

			fails.forEach(fail => {
				// @ts-ignore
				const resource = fail.source as any
				if (!resource) return
				util.logger.error(fail.error.message)
				const details = util.showDetails(resource, { compact: false })
				if (util._.isError(details)) {
					util.logger.error(details.message)
					return
				}
				util.logger.error(details)
			})
		} catch (err: any) {
			util.logger.error(err.message)
		}

		if (restoreOrigReq.changed) restoreOrigReq.req.raw = restoreOrigReq.prevreqdata
	}

	// pcli move --from resources... --to resources...
	// notice that `pcli move` isn't variadic.
	// it has options, which are variadic.
	static async move(args: PcliOpts.CmdMoveOpts, cmd: commander.Command) {
		const co = await util.getOptCollection(cmd)

		const resourceFrom = util.getNestedResource(co, args.from)
		if (util._.isError(resourceFrom)) {
			util.logger.error(resourceFrom.message)
			return
		}
		let resourceTo: PcliResource | psdk.Collection | Error
		if (args.to.length == 1 && args.to[0] == 'collection') resourceTo = co
		else {
			resourceTo = util.getNestedResource(co, args.to)
			if (util._.isError(resourceTo)) {
				util.logger.error(resourceTo.message)
				return
			}
		}

		util.setParent(co, resourceTo, resourceFrom)
		util.showResourceListRecur([co])
		util.saveChanges(cmd, co)
	}

	static async rename(args: PcliOpts.CmdVariadicResources, ..._cmd: [PcliOpts.CmdRenameOpts, commander.Command]) {
		const [optional, cmd] = _cmd
		const co = await util.getOptCollection(cmd)

		const item = util.getNestedResource(co, args)
		if (util._.isError(item)) {
			util.logger.error(item.message)
			return
		}
		item.name = optional.name
		util.showResourceListRecur([item?.parent() || co])
		util.saveChanges(cmd, co)
	}

	static async delete(args: PcliOpts.CmdVariadicResources, ..._cmd: [PcliOpts.CmdDeleteOpts, commander.Command]) {
		const [optional, cmd] = _cmd
		const co = await util.getOptCollection(cmd)

		const item = util.getNestedResource(co, args)
		if (util._.isError(item)) {
			util.logger.error(item.message)
			return
		}
		const parent = item.parent()
		const children: psdk.PropertyList<any> = util.getChildren(parent, false)
		children.remove(e => e.id == item.id, {})
		util.saveChanges(cmd, co)
		util.showResourceListRecur([parent])
	}
}
