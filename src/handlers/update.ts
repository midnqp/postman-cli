import services from '@src/services/index.js'
import psdk from 'postman-collection'
import { PostmanCli } from '@src/types'
import { Command } from 'commander'
import util from 'node:util'
import _ from 'lodash'
import Enquirer from 'enquirer'
import open from 'open'
import tmp from 'tmp'
import fs from 'node:fs'

function openJson(input: string) {
    const { name } = tmp.fileSync({ postfix: '.js' })
    fs.writeFileSync(name, input)

    //openeditor([{file: name}])
    open(name)
    return name
}

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.Update, Command]
) {
    const [optional, cmd] = _cmd
    args = args.map(e => e.toLowerCase())
    const co = await services.cmdopts.getOptCollection(cmd)
    const resource = services.resource.getFromNested(co, args)

    if (services.response.isResponse(resource)) {
        const p = services.example.toPrintable(resource, {
            addParsedBody: true,
        })

        const str = util.inspect(p, {
            colors: false,
            maxArrayLength: null,
            maxStringLength: null,
            depth: 50,
        })
        //const prompt = await editor({default: str, message: ''})
        const filename = openJson(str)
        let done: boolean
        try {
            const enq = (await Enquirer.prompt({
                name: 'done',
                required: true,
                initial: true,
                message: 'press any key to continue',
                type: 'confirm',
            })) as any
            done = enq.done
        } catch (err) {
            done = false
        }

        if (!done) return

        type ParsedPrompt = {
            request: PostmanCli.RequestPrintable
            response: PostmanCli.ResponsePrintable
        }
        let prompt: ParsedPrompt
        try {
            prompt = eval(
                '(' + (await fs.promises.readFile(filename, 'utf8')) + ')'
            )
        } catch (e) {
            throw Error('could not parse')
        }
        const parsed = prompt

        let request: psdk.RequestDefinition | undefined
        if (parsed.request && !_.isEmpty(parsed.request)) {
            const rawBody = JSON.stringify(parsed.request.body)
            request = {
                url: {
                    path: parsed.request.url.path,
                    query: services.common.jsonToHeaders(parsed.request.query),
                },
                body: { mode: 'raw', raw: rawBody },
                header: services.common.jsonToHeaders(parsed.request.headers),
                method: parsed.request.url.method,
            }
        }
        const response = new psdk.Response({
            code: parsed.response.code,
            responseTime: parsed.response.time || 0,
            body: JSON.stringify(parsed.response.body),
            header: services.common.jsonToHeaders(parsed.response.headers),

            originalRequest: request,
        })

        services.example.print(response)
        const fn = async () => {
            try {
                const { saveOrNot } = (await Enquirer.prompt({
                    name: 'saveOrNot',
                    type: 'select',
                    message: 'save changes?',
                    choices: [{ name: 'yes' }, { name: 'no' }],
                })) as any

                return saveOrNot
            } catch (e) {
                return 'no'
            }
        }
        const saveOrNot = await fn()

        if (saveOrNot == 'yes') {
            resource.update(response)
            await services.collection.save(cmd, co)
        }
    }
}
