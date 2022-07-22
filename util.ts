import { promises as fs } from 'fs'
import chalk from 'chalk'
import psdk from 'postman-collection'
import axios from 'axios'
import { inspect } from 'node:util'
import env from './env.js'
import _ from 'lodash'
import { logger } from './logger.js'
export { logger, _ }

type PcliResource = psdk.Item | psdk.ItemGroup< psdk.Item > | psdk.Response

/**
 * Show an item/example formatted.
 * @kind util
 */
export function showDetails (resource: psdk.Item | psdk.Response) {
	let req: psdk.Request | undefined
	if (resource instanceof psdk.Response) req = resource.originalRequest
	else req = resource.request

	if (!req)
		return Error(`not found: request data on example "${resource.name}"`)

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
export const ex = (o, depth = 4, showHidden = true) =>
	inspect(o, {
		indentationLvl: 2,
		colors: true,
		depth,
		showHidden,
		//sorted: true,
	})

/**
 * Goes deep recursively and finds a nested
 * folder/request/example.
 *
 * @kind util
 */
export function findRecurse (parent, args): PcliResource {
	const findNext = (name: string, parentIter) => {
		if (!parentIter.find) return
		return parentIter.find(rule => rule.name.toLowerCase() === name, {})
	}

	let resource = parent.items
	let currDepth = 0
	const nextName = () => args[currDepth]
	let tmp = findNext(nextName(), resource)

	while (tmp) {
		currDepth++
		if (psdk.ItemGroup.isItemGroup(tmp))
			resource = (<psdk.ItemGroup< psdk.Item >>tmp).items
		else if (psdk.Item.isItem(tmp)) resource = tmp.responses
		else if (psdk.PropertyList.isPropertyList(tmp)) resource = tmp.members
		else if (psdk.Response.isResponse(tmp)) resource = tmp as psdk.Response
		tmp = findNext(nextName(), resource)
	}
	return resource
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
