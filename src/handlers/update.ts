import services from '@src/services/index.js'
import { PostmanCli } from '@src/types'
import { Command } from 'commander'
import editor from '@inquirer/editor'
import util from 'node:util'

export default async function (
    args: PostmanCli.Cmd.VariadicResources,
    ..._cmd: [PostmanCli.Cmd.Opts.Update, Command]
) {
    const [optional, cmd] = _cmd
    args = args.map(e => e.toLowerCase())
    const co = await services.cmdopts.getOptCollection(cmd)
    if (services.common._.isError(co)) {
        services.logger.error(co.message)
        return
    }
    const resource = services.resource.getFromNested(co, args)
    if (services.common._.isError(resource)) {
        services.logger.error(resource.message)
        return
    }

    if (services.response.isResponse(resource)) {
        const p = services.response.toPrintable(resource)
        const str = util.inspect(p, {
            colors: false,
            maxArrayLength: null,
            maxStringLength: null,
        })
        const prompt = await editor({ default: str, message: '' })
        console.log(prompt)
    }
}
