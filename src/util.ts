import { promises as fs } from 'fs'
import chalk from 'chalk'
import psdk from 'postman-collection'
import axios, {AxiosResponse} from 'axios'
import { inspect } from 'node:util'
import env from './env.js'
import _ from 'lodash'
import { logger } from './logger.js'
export { logger, _ }

export type PcliResource = psdk.Item | psdk.ItemGroup< any > | psdk.Response

type ResourceDetails = {headers: any; params: any; query: any; body: any; url: {path: string; method: string}}

/**
 * Show an item/example formatted.
 * @kind util
 */
export function showDetails (resource: psdk.Item | psdk.Response| ResourceDetails, ignore=['url', 'headers']) {
	let name = ''
	let details:ResourceDetails
	if (isItem(resource) || isResp(resource)) {
		const _details = getDetails(resource)
		if (_.isError(_details)) return _details
		details = _details
		name = resource.name
	}
	else details = resource
	
	const urlLine = details.url.method + ' ' + details.url.path
	let result = chalk.inverse(name) + ' ' + urlLine
	const filteredDetails:any = {}
	Object.entries(details).forEach(([ k, v ]) => {
		if (ignore.includes(k)) return
		const _v = ex(v)
		if (_v.length > 2) filteredDetails[k] = v
	})
	const formatted = ex(filteredDetails, true)
	result += formatted.length > 2 ? '\n'+formatted : ''
	return result
}

/** Gets details from Postman requests and examples. */
export function getDetails (resource:psdk.Item|psdk.Response): Error | ResourceDetails  {
	let req: psdk.Request | undefined
	if (resource instanceof psdk.Response) req = resource.originalRequest
	else req = resource.request

	if (!req)
		return Error(`not found request data on "${resource.name}"`)

	return {
		params: req.url.variables.toObject(),
		query: req.url.query.toObject(),
		body: JSON.parse(req.body?.raw || '{}'),
		url: {
			path: req.url.getPath({ unresolved: true }), 
			method: req.method.toLowerCase()
		},
		headers: req.headers.toObject()
	}
}

/**
 * Pretty-prints an object recursively.
 * @kind util
 */
export const ex = (o, compact=false) => {
	const result = inspect(o, {
		indentationLvl: 2,
		colors: true,
		depth:5,
		showHidden:false,
		compact,
		maxArrayLength: 4,
		maxStringLength: 16
		//sorted: true,
	})
	return result
}

/**
 * Goes deep recursively and finds a nested
 * folder/request/example.
 * 
 * @param parent A collection.
 * @param args Nested resources, as in: folder1 folder2 request1 example2
 * @kind util
 */
export function findRecurse (parent, args:string[]): PcliResource|Error {
	/** Finds next resource.  */
	const findNext = (name: string, parentIter) => {
		if (!parentIter.find) return
		return parentIter.find(rule => rule.name.toLowerCase() === name, {})
	}

	let resource = parent.items
	let currDepth = 0
	const maxDepth = args.length
	const nextName = () => args[currDepth]
	/** Additionally increments currDepth. */
	const isLast = () => ++currDepth === maxDepth
	let tmp 

	while (currDepth < maxDepth) {
		const name = nextName()
		tmp = findNext(name, resource) 
		if (!tmp) {
			let msg = ''
			if (resource instanceof psdk.ItemGroup)
				msg = `"${name}" not found in "${resource.name}".`
			else msg = `"${name}" not found in "${parent.name}".`
			return Error(msg)
		}
		const isItemGroup = tmp instanceof psdk.ItemGroup
		const isItem = tmp instanceof psdk.Item
		const isResponse = tmp instanceof psdk.Response
		
		if (isItemGroup) {
			if (isLast()) return tmp
			resource = tmp.items
		}
		else if (isItem) {
			if (isLast()) return tmp
			resource = (tmp.responses as any).members
		}
		else if (isResponse) {
			if (isLast()) return tmp
			resource = tmp 
		}
		else return Error(`Found unknown instance "${name}".`)
	}
	return resource
}

export function isIterable (value) {
	return Symbol.iterator in Object(value)
}

export function isItem(value):value is psdk.Item  {
	return psdk.Item.isItem(value)
}

export function isFolder(value):value is psdk.ItemGroup<any> {
	return psdk.ItemGroup.isItemGroup(value)
}

export function isResp(value): value is psdk.Response {
	return psdk.Response.isResponse(value)
}

export function isColl(value): value is psdk.Collection {
	return psdk.Collection.isCollection(value)
}

/**
 * Lists names of resources recursively.
 * Note that, this recursive function is reckless.
 * @param args Doesn't seem to have a use-case here
 * @param parent An iterable
 * @param cb Callback function to execute for each item in `param`
 * @param optionalArgs Optional cmdline args
 * @kind util
 */
export function listRecurse (parent, args: string[], names, cb:(store, item)=>void, optionalArgs?:Record<string,any>, currDepth=0) {
	if (isIterable(parent)) parent.forEach(item => {
		names.push([])
		const store = names.at(-1)
		let iter:any[] = []
		let isDepthInc=false
		if (optionalArgs && optionalArgs.d > currDepth) {
			if ( isFolder(item) ) {
				iter= item.items.all()
				currDepth++
				isDepthInc =true
			}
			else if (isItem(item))  {
				iter =item.responses.all()
				currDepth++
				isDepthInc =true
			}
		}
		
		cb(store, item)
		listRecurse(iter, args, store, cb, optionalArgs, currDepth)
		if (isDepthInc) currDepth--
	})
}

export const sleep = ms => new Promise(r => setTimeout(r, ms))

export function getSymbol(value) {
	let result = ''
	if (isColl(value)) result= 'C'
	else if (isFolder(value)) result='F'
	else if (isItem(value)) result= 'R'
	else if (isResp(value)) result= 'E'
	else result= '?'
	
	return chalk.white(result)
}

export function showList (names) {
	let result = ''
	let tab = 0
	const recurse = array => array.forEach(e => {
		if (Array.isArray(e)) {
			tab++
			result += '\t'.repeat(tab)+ ' '+ e[0] +'\n'
			recurse(e)
		}
		if (_.isEqual(array.at(-1), e)) tab--
	})

	recurse(names)
	return result
}

export function deepFind(arr, id) {
	for (const item of arr) {
		if (item.id === id) {
			return item
		}
		let isNewDepth = false
		let nextArr:any[] = []
		if (isFolder(item) || isColl(item)) {
			nextArr = item.items.all()
			isNewDepth=true
		}
		else if (isItem(item)) {
			nextArr = item.responses.all()
			isNewDepth=true
		}
		else if (!isPostmanEntity(item) && Array.isArray(item.items)) {
			nextArr = item.items
			isNewDepth=true
		}
		if (isNewDepth) {
			const found = deepFind(nextArr, id)
			if (found) {
				return found
			}
		}
	}
}

export function isPostmanEntity(item) {
	return isFolder(item) || isItem(item) || isResp(item) || isColl(item)
}

export const getItemParent = (arr, id) => {
	const parent = traverseListRecur(arr, ({nextArr}) =>{
		if (nextArr.find(e => e.id == id)) return true
	}, {currDepth:0, stopOnResult:true})
	return parent
}

/**
 * Moves item/resource under parent.
 * Checks for renames.
 */
export function setParent(collection, parentId, item) {
	const newParentInColl = deepFind([collection], parentId)
	const itemInColl = deepFind(collection.items.all(), item.id)
	const oldParentInColl = getItemParent([collection], itemInColl.id)

	let refAdd, refRemove
	if (isFolder(newParentInColl) || isColl(newParentInColl))
		refAdd = newParentInColl.items
	else refAdd = newParentInColl.responses
	
	if (isFolder(oldParentInColl) || isColl(oldParentInColl))
		refRemove = oldParentInColl.items
	else refRemove = oldParentInColl.responses

	const isSameParent = oldParentInColl.id == newParentInColl.id
	const isSameName = item.name == itemInColl.name
	if (!isSameName) itemInColl.name = item.name
	if (!isSameParent) {
		refAdd.add(itemInColl)
		refRemove.remove(itemInColl.id)
	}
}

export async function saveChanges (cmd, collection) {
	const exportPath = env.collectionFilepath || cmd.parent.opts().collection
	if (exportPath) fs.writeFile(exportPath, JSON.stringify(collection, null, 2))
	
	if (env.collectionUrl) {
		const response = await axios.put(env.collectionUrl, collection)
		logger.out(ex(parseAxiosError(response)))
	}
}

/** 
 * Recursively **deep**-traverses nested Postman
 * resources. Any form of persistence
 * between the recursion should be maintained
 * in the callback `cb`.
 *
 * @param arr list of collection/folder/request
 * @param cb callback to run
 * @return item
 * If `cb` returned true, the current resource(item)
 * is returned.
 */
export function traverseListRecur(arr, cb, options:any) {
	let {currDepth=0, d:depth} = options
	depth = Number(depth)
	depth = Number.isNaN(depth)?100:depth
	let nextArr:any[] = []

	for (const item of arr) {
		let isDepthInc=false
		if (depth > currDepth) {
			if (isFolder(item) || isColl(item)) {
				nextArr = item.items.all()
				currDepth++
				isDepthInc =true
			}
			else if (isItem(item))  {
				nextArr =item.responses.all()
				currDepth++
				isDepthInc =true
			}
			else if (!isPostmanEntity(item) && Array.isArray(item.items)) {
				nextArr = item.items
				currDepth++
				isDepthInc=true
			}
		}
		const resultCb = cb({item, nextArr, currDepth})
		if (resultCb===true) {
			if (!options.result) options.result = []
			options.result.push(item)
			if (options.stopOnResult) return item
		}
		if (isDepthInc) {
			const result = traverseListRecur(nextArr, cb, {...options, currDepth})
			if (result) return result
			currDepth--
		}
	}
}

export function getVariables(cmd) {
	const variables = cmd.parent.opts().variables || env.variables || '{}'
	return JSON.parse(variables)
}

/**
 * @kind util
 */
export async function getCollection (cmd) {
	const filepath = cmd.parent.opts().collection || env.collectionFilepath
	const foundFile = await fileExists(filepath)
	const collJson = await fs.readFile(filepath, 'utf8')
	let _co: any = {}
	
	if (filepath && foundFile) _co = JSON.parse(collJson)
	else if (!filepath && env.apiKey && env.collectionUrl) {
		const { data } = await axios.get(env.collectionUrl, {
			headers: { 'X-API-Key': env.apiKey },
		})
		_co = data.collection
	}
	
	if (_.isEqual(_co, {})) logger.warn('no collection is found, creating new')
	const co = _co.collection ? _co.collection : _co
	return new psdk.Collection(co)
}

export function fileExists (path) {
	return fs
		.access(path)
		.then(_ => true)
		.catch(_ => false)
}

export function parseAxiosError(err){
	const {config:{url}, response: {status, statusText, headers, data }} = err
	return {url, status, statusText, headers, data }
}
