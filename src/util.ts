import { promises as fs } from 'fs'
import chalk from 'chalk'
import psdk from 'postman-collection'
import axios from 'axios'
import { inspect } from 'node:util'
import env from './env.js'
import _ from 'lodash'
import { logger } from './logger.js'
export { logger, _ }

export type PcliResource = psdk.Item | psdk.ItemGroup< psdk.Item > | psdk.Response

/**
 * Show an item/example formatted.
 * @kind util
 */
export function showDetails (resource: psdk.Item | psdk.Response) {
	let req: psdk.Request | undefined
	if (resource instanceof psdk.Response) req = resource.originalRequest
	else req = resource.request

	if (!req)
		return Error(`not found request data on "${resource.name}"`)

	const line1 = [
		req.method.toLowerCase(),
		req.url.getPath({ unresolved: true }),
	].join(' ')
	const reqData: any = {
		params: req.url.variables.toObject(),
		query: req.url.query.toObject(),
		body: JSON.parse(req.body?.raw || '{}'),
	}
	const _line = {
		params: ex(reqData.params),
		query: ex(reqData.query),
		body: ex(reqData.body),
	}
	let result = chalk.inverse(resource.name) + ' ' + line1
	Object.entries(_line).forEach(([ k, v ]) => {
		if (v.length > 2) result += '\n' + k + ': ' + v
	})
	return result
}

/**
 * Pretty-prints an object recursively.
 * @kind util
 */
export const ex = (o, format=false) => {
	const result = inspect(o, {
		indentationLvl: 2,
		colors: true,
		depth:10,
		showHidden:false,
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
	let maxDepth = args.length
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

function isIterable (value) {
  return Symbol.iterator in Object(value);
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
 * @kind util
 */
export function listRecurse (parent, args: string[], names) {
	if (isIterable(parent)) parent.forEach(item => {
		names.push([])
		const store = names.at(-1)
		let iter:any[] = []
		if (item instanceof psdk.ItemGroup) {
			iter= item.items.all()
		}
		else if (item instanceof psdk.Item)  {
			iter =item.responses.all()
		}

		const nameWithSymb = [getInstanceSymbol(item), item.name].join(' ')
		store.push(nameWithSymb)
		listRecurse(iter, args, store)
	})
}

export function getInstanceSymbol(value) {
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

/**
 * @kind util
 */
export async function getCollection (cmd) {
	const filepath = cmd.parent.opts().collection || env.collectionFilepath
	let _co: any = {}
	if (filepath && (await fileExists(filepath)))
		_co = JSON.parse(await fs.readFile(filepath, 'utf8'))
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
