import fs from 'fs-extra'
import util, { inspect } from 'node:util'
import lodash from 'lodash'
import newman, { NewmanRunOptions, NewmanRunSummary } from 'newman'
import services from '@src/services/index.js'

import { PostmanCli } from '@src/types.js'

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

    /**
     * Goes deep recursively and finds a nested
     * resource. The most efficient to get a resource from args[].
     *
     * @param parent A collection.
     * @param args Nested resources, e.g. folder1 folder2 request1 example2
     *
     */
    getNestedResource(parent, args: string[]): PostmanCli.Resource | Error {
        if (args[0] == parent.name) {
            const children = services.resource.getChildren(parent)
            const found = children.find(child => {
                const c = child.name.toLowerCase()
                const p = parent.name.toLowerCase()
                return c == p
            })
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
            return parentIter.find(
                child => child.name.toLowerCase() === name,
                {}
            )
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

            if (services.folder.isFolder(tmp)) {
                if (isLast()) return tmp
                founditems.push(tmp)
                nextiter = tmp.items
            } else if (services.item.isItem(tmp)) {
                if (isLast()) return tmp
                founditems.push(tmp)
                nextiter = (tmp.responses as any).members
            } else if (services.response.isResponse(tmp)) {
                founditems.push(tmp)
                return tmp
            } else return Error(`Found unknown instance "${name}".`)
        }
        return nextiter
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
