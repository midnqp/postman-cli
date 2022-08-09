import psdk from 'postman-collection'
import * as util from './util.js'
import axios, {AxiosPromise, AxiosRequestConfig} from 'axios'

export default class {
	/**
	 * Show request body, query, path variables,
	 * headers, and few details.
	 * @todo folder having requests & examples
	 * @todo requests having examples
	 * @kind command
	 */
	static async show (args: string[], ...cmd) {
		cmd = cmd[1]
		args = args.map(e => e.toLowerCase())
		const co = await util.getCollection(cmd)

		const resource = util.findRecurse(co, args)
		if (util._.isError(resource)) {
			util.logger.error(resource.message)
			return
		}
		const result:Array<string|Error> = []
		if (resource instanceof psdk.ItemGroup)
			resource.forEachItem(e => result.push(util.showDetails(e)))
		else result.push(util.showDetails(resource))

		result.forEach(output => {
			if (util._.isError(output)) return util.logger.error(output.message)
			util.logger.out(output)
		})
	}

	/**
	 * List items in collection, folder, and request.
	 * @kind command
	 */
	static async list (args: string[], ..._cmd) {
		const [optional, cmd] = _cmd
		args = args.map(e => e.toLowerCase())
		const co = await util.getCollection(cmd)
		const names:any[] = []

		let parent:any = co
		/** Storage passed by address for listRecurse(). */
		let store = names
		
		if (args.length) {
			parent = util.findRecurse(co, args)
			if (util._.isError(parent)) {
				util.logger.error(parent.message)
				return
			}
		}
		if (parent.name) {
			const parentName = util.getInstanceSymbol(parent) + ` ${parent.name}`
			names.push([parentName])
			store=names[0]
		}
		
		if (util.isFolder(parent) || util.isColl(parent)) util.listRecurse(parent.items.all(), args, store, optional)
		else if (util.isItem(parent)) util.listRecurse(parent.responses.all(), args, store, optional)
		
		util.logger.out(util.showList(names))
	}

	static async run (args: string[], ..._cmd) {
		const [optional, cmd] = _cmd
		args = args.map(e => e.toLowerCase())
		const variables = util.getVariables(cmd)
		const co = await util.getCollection(cmd)
		co.syncVariablesFrom(variables)

		const resource = util.findRecurse(co, args)
		if (util._.isError(resource)) {
			util.logger.error(resource.message)
			return
		}
		let req:psdk.Request
		const errMsg = 'command run: resource needs to be either request, or example.'
		if (util.isItem(resource)) 
			req = resource.request
		else if (util.isResp(resource)) {
			const _req = resource.originalRequest
			if (!_req) {
				util.logger.error(errMsg)
				return
			}
			req=_req
		}
		else {
			util.logger.error(errMsg)
			return
		}

		let url = req.url.toString()
		url = co.variables.replace(url)
		let result:Awaited<AxiosPromise>|undefined
		const headers:Record<string,string> = req.headers.toObject()
		for (const [k,v] of Object.entries(headers)) 
			headers[k] = co.variables.replace(v)
		
		const reqConfig:AxiosRequestConfig= {
			headers,
			method: req.method,
			data: JSON.parse(req.body?.raw || '{}'),
			params: req.url.variables.toObject(),
			url

		}
		try {
			if (optional.r) util.logger.out(util.ex({
				headers: reqConfig.headers,
				body: reqConfig.data,
				params: reqConfig.params,
			}))
			result = await axios(reqConfig)
		}
		catch(err) {
			util.logger.error(util.ex(util.parseAxiosError(err)))
			return
		}
		if (optional.s) {/** response meta: bytes, time, etc. */}
		util.logger.out(util.ex(result.data))
	}
}
