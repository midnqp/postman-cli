import fs from 'fs-extra'
import psdk from 'postman-collection'
import util, { inspect } from 'node:util'
import lodash from 'lodash'
import newman, { NewmanRunOptions, NewmanRunSummary } from 'newman'
import services from '@src/services/index.js'

export class CommonService {
    _ = lodash

    isIterable(value) {
        return Symbol.iterator in Object(value)
    }

    parseAxiosRes(err) {
        const {
            config: { url },
            response: { status, statusText, headers, data },
        } = err
        return { url, status, statusText, headers, data }
    }

    /**
     * Promisified `newman.run`.
     * `util.promisify()` does not work.
     * @throws Error
     */
    newmanRun(options: NewmanRunOptions): Promise<NewmanRunSummary> {
        const cb = (resolve, reject) => {
            newman.run(options, (err, summary) => {
                if (err) return reject(err)
                resolve(summary)
            })
        }
        return new Promise(cb)
    }

    /**
     * Convert a string of JavaScript object
     * into JSON-parsable string.
     */
    toJsonString(input: string) {
		const keyMatcher = '([^",{}\\s]+?)'
		const valMatcher = '(.,*)'
		const matcher = new RegExp(`${keyMatcher}\\s*:\\s*${valMatcher}`, 'g')
		const parser = (_, key, value) => `"${key}":${value}`
		return input.replace(matcher, parser)
    }

    isJson(input: string) {
        try {
            JSON.parse(input)
            return true
        } catch (e) {
            return false
        }
    }

    jsonToHeaders(jsonHeaders: Record<string, any>) {
        const result = Object.entries(jsonHeaders).map(([k, v]) => {
            const value: string | any = v
            return new psdk.Header({ key: k, value })
        })
        return result
    }

    /**
     * Pretty-prints an object recursively.
     */
    getPrintedObject(o, opts: util.InspectOptions = {}): string {
        const defaults = {
            indentationLvl: 2,
            colors: true,
            depth: 5,
            showHidden: false,
        }
        const result = inspect(o, { ...defaults, ...opts })
        return result
    }

    getFormattedObject(
        object: Record<string, any>,
        options?: Array<string> | ({ ignore?: string[] } & util.InspectOptions)
    ) {
        const result: Record<string, any> = {}
        let ignore: string[] = []
        let inspectOpts: util.InspectOptions = {}

        if (!lodash.isArray(options)) {
            if (options?.ignore) {
                ignore.push(...options.ignore)
                options = lodash.omit(options, 'ignore')
            }
            const { ..._inspectOpts } = options
            inspectOpts = _inspectOpts
        } else ignore = options

        Object.entries(object).forEach(([k, v]) => {
            if (ignore.includes(k)) return
            result[k] = v
        })
        const printOpts = { ...inspectOpts }
        return services.common.getPrintedObject(result, printOpts)
    }

    benchSync(cb: () => unknown) {
        const d = performance.now()
        cb()
        return performance.now() - d
    }

    sleep(ms: number) {
        return new Promise(r => setTimeout(r, ms))
    }

    fileExists(path) {
        return fs
            .access(path)
            .then(() => true)
            .catch(() => false)
    }

    arrayMove(arr: any[], fromIndex: number, toIndex: number) {
        const element = arr[fromIndex]
        arr.splice(fromIndex, 1)
        arr.splice(toIndex, 0, element)
    }
}

export default new CommonService()
