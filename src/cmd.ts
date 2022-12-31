import fs from 'fs/promises'
import psdk from 'postman-collection'
import * as util from './util.js'
import axios, { AxiosPromise, AxiosRequestConfig } from 'axios'
import enquirer from 'enquirer'
import stripAnsi from 'strip-ansi'
import env from './env.js'
import chalk from 'chalk'
import tmp from 'tmp'
import { getEditorInfo } from 'open-editor'
import { execFile, execFileSync, spawnSync } from 'child_process'
import { inspect, promisify } from 'util'
import newman from 'newman'

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
		if (util.isFolder(resource )) resource.forEachItem(e => result.push(util.showDetails(e)))
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
		let initialparent = [co]
		if (args.length) {
		}

		const cb = nextArgs => {
			const { item } = nextArgs
			let d = nextArgs.currDepth
			if (util.isResp(item)) d++ // reached to the last i.e. an example
			const icon = util.getResourceIcon(item)
			const out = ['    '.repeat(d), icon, item.name].join(' ')
			util.logger.out(out)
		}

		util.traverseRecursively(initialparent, cb, { d: optional.d })
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
				const { response, request, item:_item, id } = exec
				//console.log(exec)
				const item = _item as any
				//const outResponse = util.showDetails(response)
				//if (util._.isError(outResponse)) {
					//util.logger.error(outResponse.message)
					//return
				//}
				//util.logger.out(outResponse)
				const outRequest = util.showDetails(item)
				if (util._.isError(outRequest)) {
					util.logger.error(outRequest.message)
					return
				}
				util.logger.out(outRequest)

				const outResponse = util.showDetailsFromResponse(response)
				util.logger.out(outResponse)
			})
		} catch (err:any) {
			util.logger.error(err.toString())
		}
	}

	/*
	static async run(args: string[], ..._cmd) {
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
		let req: psdk.Request
		const errMsg = 'expected either request, or example.'
		if (util.isItem(resource)) req = resource.request
		else if (util.isResp(resource)) {
			const _req = resource.originalRequest
			if (!_req) {
				util.logger.error(errMsg)
				return
			}
			req = _req
		} else {
			util.logger.error(errMsg)
			return
		}

		let url = req.url.toString()
		url = co.variables.replace(url)
		let result: Awaited<AxiosPromise> | undefined
		const headers: Record<string, string> = req.headers.toObject()
		for (const [k, v] of Object.entries(headers)) headers[k] = co.variables.replace(v)

		const reqConfig: AxiosRequestConfig = {
			headers,
			method: req.method,
			data: JSON.parse(req.body?.raw || '{}'),
			params: req.url.variables.toObject(),
			url,
		}
		try {
			if (optional.r)
				util.logger.out(
					util.ex({
						headers: reqConfig.headers,
						body: reqConfig.data,
						params: reqConfig.params,
					})
				)
			result = await axios(reqConfig)
		} catch (err) {
			util.logger.error(util.ex(util.parseAxiosError(err)))
			return
		}
		if (optional.s) {
			// response meta: bytes, time, etc
		}
		util.logger.out(util.ex(result.data))
	}
	*/

	/**
	 * @todo rearrange by index under same parent
	 */
	static async listEdit(args: string[], ..._cmd) {
		const [optional, cmd] = _cmd
		args = args.map(e => e.toLowerCase())
		const co = await util.getOptCollection(cmd)
		let resource: util.PcliResource | Error | psdk.Collection = co

		if (args.length) resource = util.findRecurse(co, args)
		if (util._.isError(resource)) {
			util.logger.error(resource.message)
			return
		}
		if (util.isResp(resource)) {
			util.logger.error('expected either folder, or request')
			return
		}

		/** For JSON file-edit by user. */
		const names: any = []
		listRecurEdit([resource], args, names, optional)

		const tmpFile = tmp.fileSync()
		const fileContent = JSON.stringify(names, null, '\t')
		await fs.writeFile(tmpFile.name, fileContent)
		const editor = getEditorInfo([{ file: tmpFile.name }])
		if (editor.isTerminalEditor) spawnSync(editor.binary, [tmpFile.name], { stdio: 'inherit' })
		else {
			execFile(editor.binary)
			await enquirer.prompt({ name: 'press any key when changes done:', type: 'input', message: '' })
		}

		const editedFile = await fs.readFile(tmpFile.name, 'utf8')
		const editedJson = JSON.parse(editedFile)
		tmpFile.removeCallback()

		let hasChanges = false
		const opsResult: any[] = []
		/** From the user-edited JSON. */
		const cbOps = ({ item }) => {
			const _co = util.deepFind([co], item.id)
			if (util.isColl(_co)) return
			const parent = util.getItemParent(editedJson, item.id)
			util.setParent(co, parent.id, item)
			hasChanges = true
		}
		util.traverseRecursively(editedJson[0].items, cbOps, { ...optional, collection: co, result: opsResult })

		// show the resource
		const cbShow = (store, item) => {
			const name = util.getResourceIcon(item) + ' ' + item.name
			store.push(name)
		}
		const finalShow: any[] = []
		util.listRecurse([resource], args, finalShow, cbShow, optional)
		util.logger.out(util.showList(finalShow))

		// persist changes
		if (hasChanges) util.saveChanges(cmd, co)
	}
}

function listRecurEdit(parent, args, names, optArgs, currDepth = 0) {
	for (const item of parent) {
		let iter: any[] = []
		let isDepthInc = false
		if (optArgs && optArgs.d > currDepth) {
			if (util.isFolder(item) || util.isColl(item)) {
				iter = item.items.all()
				currDepth++
				isDepthInc = true
			} else if (util.isItem(item)) {
				iter = item.responses.all()
				currDepth++
				isDepthInc = true
			}
		}

		const entry: any = { id: item.id, name: item.name }
		let store = names
		if (isDepthInc) {
			entry.items = []
			names.push(entry)
			store = names.at(-1).items
		} else names.push(entry)

		if (isDepthInc) {
			listRecurEdit(iter, args, store, optArgs, currDepth)
			currDepth--
		}
	}
}
