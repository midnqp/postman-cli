import psdk from 'postman-collection'
import * as util from '@src/util.js'
import * as commander from 'commander'
import {PostmanCli} from '@src/types.js'

export default async function (args: PostmanCli.Cmd.VariadicResources, ..._cmd: [PostmanCli.Cmd.Opts.List, commander.Command]) {
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
	const restoreOrigReq: any = {
		changed: false,
		req: undefined,
		prevreqdata: undefined,
	}

	if (util.isResp(resource)) {
		const tmp = resource.parent()
		if (tmp) {
			const item = tmp as psdk.Item
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
		const summ = await util.newmanRun({collection: co, folder: runnable.id})
		const execs = summ.run.executions
		const fails = summ.run.failures

		execs.forEach(exec => {
			// @ts-ignore
			const {response, item: _item} = exec
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
			const details = util.showDetails(resource, {compact: false})
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
