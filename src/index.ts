import { Command } from 'commander'
import Handlers from '@src/handlers/index.js'

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
    .action(Handlers.show)

program
    .command('list [resources...]')
    .description('list resources recursively')
    .option('-d, --depth [number]', 'max recursive depth', 'Infinity')
    .action(Handlers.list)

program
    .command('run <resources...>')
    .description('runs a request')
    .action(Handlers.run)

program
    .command('move')
    .description('move a resource under another parent')
    .requiredOption('--from <resources...>')
    .requiredOption('--to <resources...>')
    .action(Handlers.move)

program
    .command('rename <resources...>')
    .description('rename a resource')
    .requiredOption('--name <string>', 'new name of resource')
    .action(Handlers.rename)

program
    .command('delete <resources...>')
    .description('remove a resource')
    .action(Handlers.delete)

program
    .command('reorder <resources...>')
    .description('reorder a resource under the same parent')
    .requiredOption('--index <number>', 'new 1-based index')
    .action(Handlers.reorder)

program.parse()
