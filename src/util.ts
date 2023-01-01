import { promises as fs } from 'fs'
import chalk from 'chalk'
import psdk from 'postman-collection'
import axios, { AxiosResponse } from 'axios'
import { inspect } from 'util'
import env from './env.js'
import _ from 'lodash'
import { logger } from './logger.js'
export { logger, _ }
import * as viewUtil from './view.js'
export * from './view.js'

export type PcliResource = psdk.Item | psdk.ItemGroup<any> | psdk.Response

/**
 * Pretty-prints an object recursively.
 * @kind util
 */
export const ex = (o, compact = false) => {
	const result = inspect(o, {
		indentationLvl: 2,
		colors: true,
		depth: 5,
		showHidden: false,
		compact,
		maxArrayLength: 4,
		maxStringLength: 16,
		//sorted: true,
	})
	return result
}


export function benchSync(cb) {
	const d = performance.now()
	cb()
	return performance.now()-d
}

/**
 * Goes deep recursively and finds a nested
 * resource. The most efficient to get a resource from args[].
 *
 * @param parent A collection.
 * @param args Nested resources, as in: folder1 folder2 request1 example2
 * @kind util
 */
export function findRecurse(parent, args: string[]): PcliResource | Error {
	/** Finds next resource.  */
	const findNext = (name: string, parentIter) => {
		if (!parentIter.find) return // commentable?? TODO
		return parentIter.find(rule => rule.name.toLowerCase() === name, {})
	}

	let nextIterResource = parent.items
	let currDepth = 0
	const maxDepth = args.length
	const nextName = () => args[currDepth]
	/** Additionally increments currDepth. */
	const isLast = () => ++currDepth === maxDepth
	let tmp
	const founditems:any = []

	while (currDepth < maxDepth) {
		const name = nextName()
		tmp = findNext(name, nextIterResource)
		if (!tmp) {
			let msg = ''
			if (isFolder(nextIterResource)) 
				msg = `"${name}" not found inside "${nextIterResource.name}".`
			else {
				const resname = founditems.at(-1).name
				msg = `"${name}" not found inside "${resname}".`
			}
			return Error(msg)
		}

		if (isFolder(tmp)) {
			if (isLast()) return tmp
			founditems.push(tmp)
			nextIterResource = tmp.items
		} else if (isItem(tmp)) {
			if (isLast()) return tmp
			founditems.push(tmp)
			nextIterResource = (tmp.responses as any).members
		} else if (isResp(tmp)) {
			founditems.push(tmp)
			//if (isLast()) return tmp
			//resource = tmp
			// NOTE nothing can go beyond a response! Stop!
			return tmp
		} else return Error(`Found unknown instance "${name}".`)

	}
	return nextIterResource
}

export function isIterable(value) {
	return Symbol.iterator in Object(value)
}

export function isItem(value): value is psdk.Item {
	return psdk.Item.isItem(value)
}

export function isFolder(value): value is psdk.ItemGroup<any> {
	return psdk.ItemGroup.isItemGroup(value)
}

export function isResp(value): value is psdk.Response {
	return psdk.Response.isResponse(value)
}

export function isColl(value): value is psdk.Collection {
	return psdk.Collection.isCollection(value)
}

export function isReq(value): value is psdk.Request {
	return psdk.Request.isRequest(value)
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
export function listRecurse(
	parent,
	args: string[],
	names,
	cb: (store, item) => void,
	optionalArgs?: Record<string, any>,
	currDepth = 0
) {
	if (isIterable(parent))
		parent.forEach(item => {
			names.push([])
			const store = names.at(-1)
			let iter: any[] = []
			let isDepthInc = false
			if (optionalArgs && optionalArgs.d > currDepth) {
				if (isFolder(item)) {
					iter = item.items.all()
					currDepth++
					isDepthInc = true
				} else if (isItem(item)) {
					iter = item.responses.all()
					currDepth++
					isDepthInc = true
				}
			}

			cb(store, item)
			listRecurse(iter, args, store, cb, optionalArgs, currDepth)
			if (isDepthInc) currDepth--
		})
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export function getResourceIcon(value) {
	let text = ''
	let color=chalk.bold
	if (isColl(value)) 
		text = 'C'
	else if (isFolder(value)) text = 'F'
	else if (isItem(value)) text = 'R'
	else if (isResp(value)) text = 'E'
	else text = '?'

	return color(' '+text+' ' )
}

export function showList(names) {
	let result = ''
	let tab = 0
	const recurse = array =>
		array.forEach(e => {
			if (Array.isArray(e)) {
				tab++
				result += '\t'.repeat(tab) + ' ' + e[0] + '\n'
				recurse(e)
			}
			if (_.isEqual(array.at(-1), e)) tab--
		})

	recurse(names)
	return result
}

// wrong:
// if you have `n` items, you don't go deep into
// 0th item of `n` items. Rather you check for
// the current `n` items first, then you go deep
// into 0th item of `n`.
export function deepFind(arr, id) {
	for (const item of arr) {
		if (item.id === id) {
			return item
		}
		let isNewDepth = false
		let nextArr: any[] = []
		if (isFolder(item) || isColl(item)) {
			nextArr = item.items.all()
			isNewDepth = true
		} else if (isItem(item)) {
			nextArr = item.responses.all()
			isNewDepth = true
		} else if (!isPostmanEntity(item) && Array.isArray(item.items)) {
			nextArr = item.items
			isNewDepth = true
		}
		if (isNewDepth) {
			const found = deepFind(nextArr, id)
			if (found) {
				return found
			}
		}
	}
}

/**
 * For n items, checks (runs callback) for each item first.
 *
 * Secondly, goes out deep in ascending order, for each item.
 *
 * Seems like more performant! Alhamdulillah!
 */
export function traverseShallowFirst(recursivable: any[], cb, options: any = {}) {
	let nextArr: any[] = []

	const nextArrMap: Array<any[]> = []

	for (let i = 0; i < recursivable.length; i++) {
		const item = recursivable[i]

		if (isFolder(item) || isColl(item)) {
			nextArr = item.items.all()
			nextArrMap[i] = nextArr
		} else if (isItem(item)) {
			nextArr = item.responses.all()
			nextArrMap[i] = nextArr
		} else if (!isPostmanEntity(item) && Array.isArray(item.items)) {
			nextArr = item.items
			nextArrMap[i] = nextArr
		}

		const cbresult = cb({ nextArr, currArr: recursivable, item })
		if (cbresult) return cbresult
	}

	for (let i = 0; i < recursivable.length; i++) {
		const nextArr = nextArrMap[i]
		if (!Array.isArray(nextArr)) continue
		const found = traverseShallowFirst(nextArr, cb)
		if (found) return found
	}
}

export function getResourceFromArgsSWF(recursivable: any[], args: string[]) {
	const cb = ({ item, nextArr }) => {
		//console.log(getResourceIcon(item), item.name, nextArr.length)
	}
	const resource = traverseShallowFirst(recursivable, cb)
	return resource
}

export function isPostmanEntity(item) {
	return isFolder(item) || isItem(item) || isResp(item) || isColl(item)
}

/**
 * traverse the entire collection and find his parent!
 * inefficient! just use item.parent()
 */
export function getItemParent(arr, parentid) {
	const parent = traverseRecursively(
		arr,
		({ nextArr }) => {
			if (nextArr.find(e => e.id == parentid)) return true
		},
		{ currDepth: 0, returnOnStop: true }
	)
	return parent
}

/**
 * Moves item/resource under parent.
 * Checks for renames.
 */
export function setParent(collection:psdk.Collection, newParent, item) {
	const newParentInColl = newParent
	//const itemInColl = deepFind(collection.items.all(), item.id)
	const itemInColl = item
	const oldParentInColl = item.parent()
	//const oldParentInColl = getItemParent([collection], itemInColl.id)

	let refAdd, refRemove
	if (isFolder(newParentInColl) || isColl(newParentInColl)) refAdd = newParentInColl.items
	else refAdd = newParentInColl.responses

	if (isFolder(oldParentInColl) || isColl(oldParentInColl)) refRemove = oldParentInColl.items
	else refRemove = oldParentInColl.responses

	const isSameParent = oldParentInColl.id == newParentInColl.id
	const isSameName = item.name == itemInColl.name
	if (!isSameName) itemInColl.name = item.name
	if (!isSameParent) {
		refAdd.add(itemInColl)
		refRemove.remove(itemInColl.id)
	}

	viewUtil.showResourceListRecur([collection])
}

export async function saveChanges(cmd, collection) {
	const exportPath = cmd.parent.opts().collection || env.collectionFilepath
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
 * @param recursivableArr
 * @param cb callback to run for each recursion
 * @param options
 * @kind recursive
 * @return item
 * If `cb` returned true, the current resource(item)
 * is returned.
 */
export function traverseRecursively(
	recursivableArr: Array<any>,
	cb: (infoNext: { item; currArr: Array<any>; nextArr: Array<any>; currDepth: number }) => boolean | void,
	options: { currDepth?: any; returnOnStop?: any; result?: any; d?: any } = {}
) {
	let { currDepth = 0, d: maxDepth } = options
	maxDepth = Number(maxDepth)
	maxDepth = Number.isNaN(maxDepth) ? 100 : maxDepth
	let nextArr: any[] = []

	for (const item of recursivableArr) {
		let isdepthinc = false
		if (maxDepth > currDepth) {
			if (isFolder(item) || isColl(item)) {
				nextArr = item.items.all()
				currDepth++
				isdepthinc = true
			} else if (isItem(item)) {
				nextArr = item.responses.all()
				currDepth++
				isdepthinc = true
			} else if (!isPostmanEntity(item) && Array.isArray(item.items)) {
				nextArr = item.items
				currDepth++
				isdepthinc = true
			} else nextArr = item // item isn't an array, sorry!
		}
		const cbresult = cb({ item, nextArr, currDepth, currArr: recursivableArr })
		if (cbresult === traverseConsts.NO_MORE) {
			if (!options.result) options.result = []
			options.result.push(item)
			if (options.returnOnStop) return item
		} else if (cbresult === traverseConsts.EXIT) {
			// optimizations!! ;)
			nextArr = []
			currDepth = maxDepth
		}
		if (isdepthinc) {
			const result = traverseRecursively(nextArr, cb, { ...options, currDepth })
			if (result) return result
			currDepth--
		}
	}
}
export const traverseConsts = {
	/** just continue - usually `void` */
	CONTINUE: undefined,
	/** proceed no more in the current recursion */
	NO_MORE: true as const,
	/** immediate exit traverse */
	EXIT: false as const,
}

export function getResourceByName(recursivableArr, name) {
	return traverseRecursively(recursivableArr, ({ item }) => item.name == name)
}

/**
 * @param args nested resources
 * e.g. folder2 folder1 request4 example1
 */
export function getResourceFromArgs(co, args) {
	let i = 0
	let resource
	const cb = nextArgs => {
		if (nextArgs.item.name == args[i]) {
			i++
			if (i == args.length) {
				resource = nextArgs.item // if last one
				return traverseConsts.EXIT
			}
			return traverseConsts.NO_MORE
		}
	}
	traverseRecursively([co], cb)
	return resource
}

export function getOptVariables(cmd) {
	const variables = cmd.parent.opts().variables || env.variables || '{}'
	return JSON.parse(variables)
}

/**
 * @kind util
 */
export async function getOptCollection(cmd) {
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

export function getResponsecodeIcon(code, text) {
	return code + ' '+text
}
export function getRequestmethodIcon(method:string) {
	return method
}

export function fileExists(path) {
	return fs
		.access(path)
		.then(_ => true)
		.catch(_ => false)
}

export function parseAxiosError(err) {
	const {
		config: { url },
		response: { status, statusText, headers, data },
	} = err
	return { url, status, statusText, headers, data }
}
