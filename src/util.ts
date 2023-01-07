import * as fs from 'fs-extra'
import psdk from 'postman-collection'
import axios from 'axios'
import { inspect } from 'util'
import uuid from 'uuid'
import _ from 'lodash'

import { logger } from './logger.js'
export { logger, _ }
import * as utilpman from './postman.js'
import env from './env.js'
import {PcliResource} from 'typings.js'
export * from './postman.js'
export * from './traverse.js'
export * from './view.js'

/** Convert a string of JavaScript object into JSON-parsable string. */
export function toJsonString(input: string) {
	const keyMatcher = '([^",{}\\s]+?)'
	const valMatcher = '(.,*)'
	const matcher = new RegExp(`${keyMatcher}\\s*:\\s*${valMatcher}`, 'g')
	const parser = (_, key, value) => `"${key}":${value}`
	return input.replace(matcher, parser)
}

/**
 * Pretty-prints an object recursively.
 * @kind util
 */
export const ex = (o, compact: any = false) => {
	let _compact = false
	if (_.isBoolean(compact)) _compact = compact
	const opts = {
		indentationLvl: 2,
		colors: true,
		depth: 5,
		showHidden: false,
		compact: _compact,
		maxArrayLength: 4,
		maxStringLength: 16,
		...(_.isPlainObject(compact) && compact),
	}
	const result = inspect(o, opts)
	return result
}

export function benchSync(cb: Function) {
	const d = performance.now()
	cb()
	return performance.now() - d
}

/**
 * Goes deep recursively and finds a nested
 * resource. The most efficient to get a resource from args[].
 *
 * @param parent A collection.
 * @param args Nested resources, e.g. folder1 folder2 request1 example2
 * @kind util
 */
export function getNestedResource(parent, args: string[]): PcliResource | Error {
	if (args[0] == parent.name) {
		const children = utilpman.getChildren(parent)
		const found = children.find(child => child.name.toLowerCase() == parent.name.toLowerCase())
		// it refers to parent itself, and only item
		if (!found && args.length == 1) return parent
		// probably it refers to the parent itself
		if (!found) args.splice(0, 1)
	}

	let nextiter = parent.items
	let currDepth = 0
	const maxDepth = args.length
	const getNext = (name: string, parentIter) => {
		if (!parentIter.find) return // commentable?? TODO
		return parentIter.find(child => child.name.toLowerCase() === name, {})
	}
	const nextName = () => args[currDepth]
	// additionally increments currDepth
	const isLast = () => ++currDepth === maxDepth
	let tmp
	const founditems: any = []

	while (currDepth < maxDepth) {
		const name = nextName()
		tmp = getNext(name, nextiter)
		if (!tmp) {
			const resname = founditems.at(-1)?.name || parent.name
			const msg = `"${name}" not found inside "${resname}".`
			return Error(msg)
		}

		if (utilpman.isFolder(tmp)) {
			if (isLast()) return tmp
			founditems.push(tmp)
			nextiter = tmp.items
		} else if (utilpman.isItem(tmp)) {
			if (isLast()) return tmp
			founditems.push(tmp)
			nextiter = (tmp.responses as any).members
		} else if (utilpman.isResp(tmp)) {
			founditems.push(tmp)
			return tmp
		} else return Error(`Found unknown instance "${name}".`)
	}
	return nextiter
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

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

	let _co: any = {}

	if (filepath && foundFile) _co = await fs.readJson(filepath, 'utf8')
	else if (!filepath && env.apiKey && env.collectionUrl) {
		const axiosopts = { headers: { 'X-API-Key': env.apiKey } }
		const { data } = await axios.get(env.collectionUrl, axiosopts)
		_co = data.collection
	} else if (filepath && !foundFile && uuid.validate(filepath) && env.apiKey) {
		// uuid
		// TODO make request with apikey
	}

	if (_.isEqual(_co, {})) logger.warn('no collection is found, creating new')
	const co = _co.collection ? _co.collection : _co
	return new psdk.Collection(co)
}

export function fileExists(path) {
	return fs
		.access(path)
		.then(_ => true)
		.catch(_ => false)
}

export function arrayMove(arr:any[], fromIndex:number, toIndex:number) {
	const element = arr[fromIndex]
	arr.splice(fromIndex, 1)
	arr.splice(toIndex, 0, element)
}
