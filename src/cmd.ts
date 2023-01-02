import * as psdk from 'postman-collection'
import * as util from './util.js'
import newman from 'newman'
import { Command, Option } from 'commander'

/**
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
	static async reorder(args: string[], ..._cmd) {
		const [optional, cmd] = _cmd
		const co = await util.getOptCollection(cmd)
		const resource = util.findRecurse(co, args)
		if (util._.isError(resource)) {
			util.logger.error(resource.message)
			return
		}
		let optIndex = Number(optional.index)

		const parent = resource.parent()
		const children: psdk.PropertyList<any> = util.getChildren(parent, false)
		const length = children.count()
		optIndex = optIndex - 1 // it was 1-based index
		if (optIndex >= length - 1) optIndex = length - 1
		else if (optIndex <= 0) optIndex = 0

		if (length > 1) {
			// @ts-ignore
			util.arrayMove(children.members, children.indexOf(resource.id), optIndex)
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
	static async show(args: string[], ...cmd) {
		cmd = cmd[1]
		args = args.map(e => e.toLowerCase())
		const co = await util.getOptCollection(cmd)

		// resource
		const resource = util.findRecurse(co, args)
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

	static async list(args: string[], ..._cmd) {
		const [optional, cmd] = _cmd
		args = args.map(e => e.toLowerCase())
		const co = await util.getOptCollection(cmd)
		let initialparent: any = [co]

		if (args.length) {
			const res = util.findRecurse(co, args)
			if (util._.isError(initialparent)) {
				util.logger.error(initialparent.message)
				return
			}
			initialparent = [res]
		}

		util.showResourceListRecur(initialparent, { d: optional.d })
	}

	static async run(args: string[], ..._cmd) {
		const [optional, cmd] = _cmd
		const variables = util.getOptVariables(cmd)
		const co = await util.getOptCollection(cmd)
		co.syncVariablesFrom(variables)

		const resource = util.getResourceFromArgs(co, args)
		try {
			const summ = await newmanRun({ collection: co, folder: resource.id })
			const execs = summ.run.executions
			execs.forEach(exec => {
				// @ts-ignore
				const { response, item: _item } = exec
				const item = _item as any
				const outRequest = util.showDetails(item)
				if (util._.isError(outRequest)) {
					util.logger.error(outRequest.message)
					return
				}
				util.logger.out(outRequest)

				const outResponse = util.showDetailsFromResponse(response)
				util.logger.out(outResponse)
			})
		} catch (err: any) {
			util.logger.error(err.toString())
		}
	}

	// pcli move --from resources... --to resources...
	// notice that `pcli move` isn't variadic.
	// it has options, which are variadic.
	static async move(args: { from: string[]; to: string[] }, cmd) {
		const { parent, options }: { parent: Command; options: Option[] } = cmd
		const co = await util.getOptCollection(cmd)

		const resourceFrom = util.findRecurse(co, args.from)
		if (util._.isError(resourceFrom)) {
			util.logger.error(resourceFrom.message)
			return
		}
		let resourceTo: util.PcliResource | psdk.Collection | Error
		if (args.to.length == 1 && args.to[0] == 'collection') resourceTo = co
		else {
			resourceTo = util.findRecurse(co, args.to)
			if (util._.isError(resourceTo)) {
				util.logger.error(resourceTo.message)
				return
			}
		}

		util.setParent(co, resourceTo, resourceFrom)
		util.showResourceListRecur([co])
		util.saveChanges(cmd, co)
	}

	static async rename(args: string[], ..._cmd: [{ name: string }, Command]) {
		const [optional, cmd] = _cmd
		const co = await util.getOptCollection(cmd)

		const item = util.findRecurse(co, args)
		if (util._.isError(item)) {
			util.logger.error(item.message)
			return
		}
		item.name = optional.name
		util.showResourceListRecur([item?.parent() || co])
		util.saveChanges(cmd, co)
	}

	static async delete(args: string[], ..._cmd) {
		const [optional, cmd] = _cmd
		const co = await util.getOptCollection(cmd)

		const item = util.findRecurse(co, args)
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
