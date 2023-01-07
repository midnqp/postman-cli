import chalk from 'chalk'
import _ from 'lodash'
import psdk from 'postman-collection'
import * as util from './util.js'
import { expect } from 'chai'
import contentType from 'content-type'
import {PcliResourceDetails, _resourcedetails_, PcliRequestable} from 'typings.js'


export function isResourceDetails(r): r is PcliResourceDetails {
	try {
		expect(new Set([r])).to.have.deep.keys([_resourcedetails_])
		return true
	} catch (err) {
		return false
	}
}

/**
 * Show an item/example formatted.
 * @kind util
 */
export function showDetails(resource: PcliRequestable | PcliResourceDetails, ignore: any = ['url', 'headers']) {
	let name = ''
	let details: PcliResourceDetails

	if (isResourceDetails(resource)) details = resource
	else {
		let _details = getReqDetails(resource)
		if (_.isError(_details)) return _details
		details = _details
		name = resource.name
	}

	const urlLine = details.url.method + ' ' + details.url.path
	let result = '\n' + chalk.underline.bold(name) + ' ' + urlLine
	const formatted = showFormattedObject(details, ignore)
	result += formatted.length > 2 ? '\n' + formatted : ''
	return result
}


// showFormattedObject(details, options: {ignorekeys: [], compactkeys:[]})
function showFormattedObject(details, options: Array<string> | any) {
	const filteredDetails: any = {}
	const toCompactKeys = ['body', 'params', 'query']
	let isCompact = true
	let ignore: string[] = []
	let expandOptions = {} as any

	if (_.isPlainObject(options)) {
		const { ignore: _ignore, ..._expandOptions } = options
		expandOptions = _expandOptions
	} else {
		ignore = options
	}

	Object.entries(details).forEach(([k, v]) => {
		if (ignore.includes(k)) return

		if (toCompactKeys.includes(k) && _.isPlainObject(details[k]) && Object.keys(details[k]).length >= 4)
			isCompact = false

		const _v = util.ex(v)
		if (_v.length > 2) filteredDetails[k] = v
	})
	return util.ex(filteredDetails, { compact: isCompact, ...expandOptions })
}

/** Gets details from Postman requests and examples. */
export function getReqDetails(resource: PcliRequestable): Error | PcliResourceDetails {
	let req: psdk.Request | undefined
	if (util.isResp(resource)) req = resource.originalRequest
	else if (util.isItem(resource)) req = resource.request
	else if (util.isReq(resource)) req = resource

	const msg = `not found request data on "${resource.name}"`
	if (!req) return Error(msg)

	return {
		params: req.url.variables.toObject(),
		query: req.url.query.toObject(),
		body: JSON.parse(req.body?.raw || '{}'),
		url: {
			path: req.url.getPath({ unresolved: true }),
			method: req.method.toLowerCase(),
		},
		headers: req.headers.toObject(),
	}
}

export function getRespDetails(r: psdk.Response) {
	const stream = r.stream
	const headers = r.headers.toObject()

	let body: any = stream
	let _parsed = false
	const contenttype = contentType.parse(headers['content-type'])
	if (contenttype.type.includes('json') && stream) {
		body = JSON.parse(stream.toString())
		_parsed = true
	} else if (contenttype.type.includes('text') && stream) {
		body = stream.toString()
		_parsed = true
	}
	// else if form-data -- parse and show as object
	// else if image -- libcaca view
	// else if sound -- play sound

	return { _parsed, size: r.responseSize, time: r.responseTime, code: r.code, status: r.status, body, headers }
}

export function showRespDetails(r: psdk.Response, options: any = ['_parsed', 'code', 'status']) {
	const details = getRespDetails(r)

	let result = '\n' + chalk.underline.bold('response')

	let color = chalk.black
	switch (r.code.toString()[0]) {
		case '2':
			color = chalk.green
			break
		case '4':
		case '5':
			color = chalk.red
			break
		default:
			color = chalk.yellow
			break
	}
	result += ' ' + color(details.code + ' ' + details.status) + '\n'

	result += showFormattedObject(details, options)
	return result
}

/** List resource tree using `travDeepFirst`. */
export function showResourceListRecur(initialparent, options = {}) {
	const cb = nextArgs => {
		const { item } = nextArgs
		let d = nextArgs.currDepth
		if (util.isResp(item)) d++ // reached to the last i.e. an example
		const icon = util.getResourceIcon(item)
		const out = ['    '.repeat(d), icon, item.name].join(' ')
		util.logger.out(out)
	}

	util.travDeepFirst(initialparent, cb, options)
}
