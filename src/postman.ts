import { promises as fs } from 'fs'
import chalk from 'chalk'
import psdk from 'postman-collection'
import axios from 'axios'
import env from './env.js'
import _ from 'lodash'

import { logger } from './logger.js'
import { ex, travConsts, travDeepFirst } from './util.js'

export function getResourceByName(arr, name) {
	return travDeepFirst(arr, data => data.item.name == name)
}

export function getResourceById(arr, id) {
	return travDeepFirst(arr, data => data.item.id == id)
}

/**
 * Don't use this!
 *
 * Uses `travDeepFirst` to get a resource. 
 * @param args nested resources
 * e.g. folder2 folder1 request4 example1
 */
export function getResourceFromArgs(co, args:string[]) {
	let i = 0
	let resource
	const cb = nextArgs => {
		if (nextArgs.item.name == args[i]) {
			i++
			if (i == args.length) {
				resource = nextArgs.item // if last one
				return travConsts.EXIT
			}
			return travConsts.NO_MORE
		}
	}
	travDeepFirst([co], cb)
	return resource
}

export function getResourceIcon(resource) {
	let text = ''
	let color = chalk.bold
	if (isColl(resource)) text = 'C'
	else if (isFolder(resource)) text = 'F'
	else if (isItem(resource)) text = 'R'
	else if (isResp(resource)) text = 'E'
	else text = '?'

	return color(' ' + text + ' ')
}

export function getResponsecodeIcon(code, text) {
	return code + ' ' + text
}
export function getRequestmethodIcon(method: string) {
	return method
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

export function isPostmanEntity(item) {
	return isFolder(item) || isItem(item) || isResp(item) || isColl(item)
}

/**
 * traverse the entire collection and find his parent!
 * inefficient! just use item.parent()
 */
export function getItemParent(arr, parentid) {
	const parent = travDeepFirst(
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
export function setParent(collection: psdk.Collection, newParent, item) {
	const oldParent = item.parent()

	let refAdd, refRemove
	if (isFolder(newParent) || isColl(newParent)) refAdd = newParent.items
	else refAdd = newParent.responses

	if (isFolder(oldParent) || isColl(oldParent)) refRemove = oldParent.items
	else refRemove = oldParent.responses

	const isSameParent = oldParent.id == newParent.id
	const isSameName = item.name == item.name
	if (!isSameName) item.name = item.name
	if (!isSameParent) {
		refAdd.add(item)
		refRemove.remove(item.id)
	}
}

/**
 * If `raw` is false, then returns `PropertyList<any>`.
 * Otherwise, returns any[].
 */
export function getChildren(parent, raw = true) {
	let result: any = []

	if (isFolder(parent) || isColl(parent)) {
		result = parent.items
		if (raw) result = result.all()
	} else if (isItem(parent)) {
		result = parent.responses
		if (raw) result = result.all()
	} else if (!isPostmanEntity(parent) && Array.isArray(parent.items)) result = parent.items

	return result
}

export async function saveChanges(cmd, collection) {
	const exportPath = cmd.parent.opts().collection || env.collectionFilepath
	if (exportPath) fs.writeFile(exportPath, JSON.stringify(collection, null, 2))

	if (env.collectionUrl) {
		const response = await axios.put(env.collectionUrl, collection)
		logger.out(ex(parseAxiosError(response)))
	}
}

export function parseAxiosError(err) {
	const {
		config: { url },
		response: { status, statusText, headers, data },
	} = err
	return { url, status, statusText, headers, data }
}
