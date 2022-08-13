import fs from 'node:fs/promises'
import {watchFile, unwatchFile, watch} from 'fs'
import psdk from 'postman-collection'
import * as util from './util.js'
import axios, {AxiosPromise, AxiosRequestConfig} from 'axios'
import enquirer from 'enquirer'
import stripAnsi from 'strip-ansi'
import env from './env.js'
import chalk from 'chalk'
import tmp from 'tmp'
import {getEditorInfo} from 'open-editor'
import {execFile, execFileSync, spawnSync} from 'node:child_process'
import {inspect} from 'node:util'

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
			const parentName = util.getSymbol(parent) + ` ${parent.name}`
			names.push([parentName])
			store=names[0]
		}
	

		const cb = function (store, item) {
			const result = util.getSymbol(item) + ' ' + item.name
			store.push(result)
		}
		if (util.isFolder(parent) || util.isColl(parent)) 
			util.listRecurse(parent.items.all(), args, store, cb, optional)
		else if (util.isItem(parent)) 
			util.listRecurse(parent.responses.all(), args, store, cb, optional)
		else {
			util.logger.error('expected either folder, or request')
			return
		}

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
		const errMsg = 'expected either request, or example.'
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

	/**
	 * @todo rearrange by index under same parent
	 * 
	 * NOTE done at 0134 hrs, alhamdulillah
	 */
	static async listEdit (args: string[], ..._cmd) {
		const defaultBeh = console.log
		console.log = (...any) => {
			if (process.env.DEBUG) defaultBeh(...any)
		}
		const [optional, cmd] = _cmd
		args = args.map(e => e.toLowerCase())
		const co = await util.getCollection(cmd)
		let resource:util.PcliResource|Error|psdk.Collection = co

		if (args.length) resource = util.findRecurse(co, args)
		if (util._.isError(resource)) {
			util.logger.error(resource.message)
			return
		}
		if (util.isResp(resource)) {
			util.logger.error('expected either folder, or request')
			return
		}
		
		let itemsParent:psdk.PropertyList<psdk.Item | psdk.ItemGroup<psdk.Item>> | psdk.PropertyList<any> | psdk.PropertyList<psdk.Response>
		let items:any[] = []
		if (util.isFolder(resource)) {
			items = resource.items.all()
			itemsParent = resource.items
		}
		else if (util.isItem(resource)) {
			items = resource.responses.all()
			itemsParent = resource.responses
		}
		else { // collection
			items = resource.items.all()
			itemsParent=resource.items
		}

		console.log(optional)
		if (optional.recurse) {
			/** For JSON file-edit by user. */
			const names:any = []
			//listRecurEdit([co], args, names, optional)
			// Having [resource] is inevitable + important.
			listRecurEdit([resource], args, names, optional)

			const tmpFile = tmp.fileSync()
			const fileContent = JSON.stringify(names, null, '\t')
			await fs.writeFile(tmpFile.name, fileContent)
			const editor = getEditorInfo([{file:tmpFile.name}])
			if (editor.isTerminalEditor) spawnSync(editor.binary, [tmpFile.name], {stdio:'inherit'})
			
			else {
				execFile(editor.binary)
				await enquirer.prompt({name: 'press any key when changes done:', type: 'input', message: ''})
			}

			const sorted = JSON.parse(await fs.readFile(tmpFile.name, 'utf8'))
			tmpFile.removeCallback()

			const opsResult:any[] = []
			/** From the user-edited JSON. */
			const cbOps = ({item, nextArr, currDepth}) => {
				console.log('cbOps', currDepth, [item.name, item.id], nextArr.map(e => e.name))
				const _collection = util.deepFind([co], item.id)
				if (util.isColl(_collection)) {console.log('found collection'); return}
				else console.log('opsResult length', opsResult.length)
				const parent = util.getItemParent(sorted, item.id)
				util.setParent(co, parent.id, item.id)
			}
			// line below: doesn't work! why???
			//util.traverseListRecur(sorted, cbOps, {...optional, collection:co})
			//
			// line below: works!! why??? git pushing anyway.
			// i think, this is absolutely crucial. because,
			// i'm specifying "public" "login user". anyone
			// might want the parent of "login user"
			util.traverseListRecur(sorted[0].items, cbOps, {...optional, collection:co, result:opsResult})
		
			// just show
			const cbShow = (store, item) => {
				store.push([util.getSymbol(item), item.name].join(' '))
			}
			const finalShow:any[] = []
			util.listRecurse([resource], args, finalShow, cbShow, optional)
			util.logger.out(util.showList(finalShow))
		}

		else {
			let res:any
			let i =0
			const deepItemNames:any = []
			listRecurseChoices(items, args, deepItemNames, optional)
			console.log(util.ex(deepItemNames))

			const itemNames = items.map(e => ({name: String(i++), message: e.name}))	
			try {
				res = await enquirer.prompt({name: 'Move items', message:'', type:'sort', choices: deepItemNames}) //itemNames
			}
			catch(err) {return}
			console.log(res)
			const indexes = getIndex(res['mv'])
			const result:any[] = []
			itemsParent.clear()
			for (let i=0; i < indexes.length; i++) {
				result[i] = items[indexes[i]]
				itemsParent.add(items[indexes[i]])
			}

			const exportPath = env.collectionFilepath || cmd.parent.opts().collection
			if (exportPath) fs.writeFile(exportPath, JSON.stringify(co, null, 2))
			
			if (env.collectionUrl) {
				const response = await axios.put(env.collectionUrl, co)
				util.logger.out(util.ex(util.parseAxiosError(response)))
			}
		}
	}
}

function listRecurEdit (parent, args, names, optArgs, currDepth=0) {
	for (const item of parent) {
		let iter:any[] = []
		let isDepthInc=false
		if (optArgs && optArgs.d > currDepth) {
			if ( util.isFolder(item) || util.isColl(item)) {
				iter= item.items.all()
				currDepth++
				isDepthInc =true
			}
			else if (util.isItem(item))  {
				iter =item.responses.all()
				currDepth++
				isDepthInc =true
			}
		}
		
		const entry:any = {id: item.id, name: item.name}
		let store = names
		if (isDepthInc) {
			entry.items = []
			names.push(entry)
			store = names.at(-1).items
		}
		else names.push(entry)
		
		if (isDepthInc) {
			listRecurEdit(iter, args, store, optArgs, currDepth)
			currDepth--
		}
	}
}

function listRecurseChoices (parent, resourceArgs: string[], names, optionalArgs?:Record<string,any>, currDepth=0) {
	if (util.isIterable(parent)) parent.forEach(item => {
		let iter:any[] = []
		let isDepthInc=false
		if (optionalArgs && optionalArgs.d > currDepth) {
			if ( util.isFolder(item) ) {
				iter= item.items.all()
				currDepth++
				isDepthInc =true
			}
			else if (util.isItem(item))  {
				iter =item.responses.all()
				currDepth++
				isDepthInc =true
			}
		}

		const choice:any = {name: item.name}
		let store = names
		if (isDepthInc) {
			choice.choices = []
			names.push(choice)
			store = names.at(-1).choices
		}
		else names.push(choice)
		//names.push({name: item.name, choices:[]})
		//const store = names.at(-1).choices
		//store.push({})
		
		listRecurseChoices(iter, resourceArgs, store, optionalArgs, currDepth)
		if (isDepthInc) currDepth--
	})
}

function getIndex(arr) {return arr.map(e => typeof e == 'string'?stripAnsi(e.split(' ')[0]): e)}
