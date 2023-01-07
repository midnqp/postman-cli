import _ from 'lodash'
import * as utilpman from './postman.js'

export const travConsts = {
	/** just continue - usually `void` */
	CONTINUE: undefined,
	/** proceed no more in the current recursion */
	NO_MORE: true as const,
	/** immediate exit traverse */
	EXIT: false as const,
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
export function travDeepFirst(
	recursivableArr: Array<any>,
	cb: (infoNext: { item; currArr: Array<any>; nextArr: Array<any>; currDepth: number }) => boolean | void,
	options: { currDepth?: any; returnOnStop?: any; result?: any; d?: any } = {}
) {
	let { currDepth = 0, d: maxDepth } = options
	maxDepth = Number(maxDepth)
	maxDepth = Number.isNaN(maxDepth) ? 100 : maxDepth
	maxDepth += 1 // otherwise thing break down at UI
	let nextArr: any[] = []

	for (const item of recursivableArr) {
		let isdepthinc = false
		if (maxDepth > currDepth) {
			if (utilpman.isFolder(item) || utilpman.isColl(item)) {
				nextArr = item.items.all()
				currDepth++
				isdepthinc = true
			} else if (utilpman.isItem(item)) {
				nextArr = item.responses.all()
				currDepth++
				isdepthinc = true
			} else if (!utilpman.isPostmanEntity(item) && Array.isArray(item?.items)) {
				nextArr = item.items
				currDepth++
				isdepthinc = true
			} else nextArr = item // item isn't an array, sorry!
		} else break
		const cbresult = cb({ item, nextArr, currDepth, currArr: recursivableArr })
		if (cbresult === travConsts.NO_MORE) {
			if (!options.result) options.result = []
			options.result.push(item)
			if (options.returnOnStop) return item
		} else if (cbresult === travConsts.EXIT) {
			// optimizations!! ;)
			nextArr = []
			return
		}
		if (isdepthinc) {
			const result = travDeepFirst(nextArr, cb, { ...options, currDepth })
			if (result) return result
			currDepth--
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
export function travShallowFirst(recursivable: any[], cb, options: any = {}) {
	let nextArr: any[] = []

	const nextArrMap: Array<any[]> = []

	for (let i = 0; i < recursivable.length; i++) {
		const item = recursivable[i]

		if (utilpman.isFolder(item) || utilpman.isColl(item)) {
			nextArr = item.items.all()
			nextArrMap[i] = nextArr
		} else if (utilpman.isItem(item)) {
			nextArr = item.responses.all()
			nextArrMap[i] = nextArr
		} else if (!utilpman.isPostmanEntity(item) && Array.isArray(item.items)) {
			nextArr = item.items
			nextArrMap[i] = nextArr
		}

		const cbresult = cb({ nextArr, currArr: recursivable, item })
		if (cbresult) return cbresult
	}

	for (let i = 0; i < recursivable.length; i++) {
		const nextArr = nextArrMap[i]
		if (!Array.isArray(nextArr)) continue
		const found = travShallowFirst(nextArr, cb)
		if (found) return found
	}
}
