import { Command } from 'commander'
import Handlers from '@src/handlers/index.js'
import services from '@src/services/index.js'

const program = new Command()
program
    .name('pcli')
    .description('postman command-line interface')
    .version('0.0.3', '--version')
    .helpOption('--help')

program
    .option('-c, --collection <string>', 'path to collection')
    .option('-h, --headers <string>', 'header for all requests')
    .option('-v, --variables <string>', 'variable for all requests')

program
    .command('show <resources...>')
    .description('show details of a resource')
    .action(catchE(Handlers.show))

program
    .command('list [resources...]')
    .description('list resources recursively')
    .option('-d, --depth [number]', 'max recursive depth', 'Infinity')
    .action(catchE(Handlers.list))

program
    .command('run <resources...>')
    .description('runs a request')
    .action(catchE(Handlers.run))

program
    .command('move')
    .description('move a resource under another parent')
    .requiredOption('--from <resources...>')
    .requiredOption('--to <resources...>')
    .action(catchE(Handlers.move))

program
    .command('rename <resources...>')
    .description('rename a resource')
    .requiredOption('--name <string>', 'new name of resource')
    .action(catchE(Handlers.rename))

program
    .command('delete <resources...>')
    .description('remove a resource')
    .action(catchE(Handlers.delete))

program
    .command('reorder <resources...>')
    .description('reorder a resource under the same parent')
    .requiredOption('--index <number>', 'new 1-based index')
    .action(catchE(Handlers.reorder))

program
    .command('update <resources...>')
    .description('update a resource details')
    .action(catchE(Handlers.update))

try {
    program.parse()
} catch (e) {
    services.common._.isError(e) && services.logger.error(e.message)
}

function catchE(fn) {
    const { isError } = services.common._
    const cb = e => isError(e) && services.logger.error(e.message)
    return (...args) => fn(...args)?.catch(cb)
}
