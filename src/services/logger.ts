import winston from 'winston'
import _ from 'lodash'
import services from '@src/services/index.js'
import cleanstack from 'clean-stack'

const {
    loggers,
    transports: { Console },
    format: { colorize, combine, printf },
} = winston

const logFormat = [
    printf(info => {
        const { level, message } = info
        if (['error', 'warn'].some(e => level.includes(e)))
            return level + ' ' + message
        return message
    }),
]
loggers.add('error', {
    levels: { error: 0 },
    transports: [new Console({ level: 'error' })],
    format: combine(colorize({ colors: { error: 'red' } }), ...logFormat),
})

loggers.add('out', {
    levels: { out: 1 },
    transports: [new Console({ level: 'out' })],
    format: combine(...logFormat),
})

loggers.add('warn', {
    levels: { warn: 1 },
    transports: [new Console({ level: 'warn' })],
    format: combine(
        colorize({ level: true, colors: { warn: 'yellow' } }),
        ...logFormat
    ),
})

type LoggerFunc = (msg: string | Error) => winston.Logger

type Logger = {
    error: LoggerFunc
    out: LoggerFunc
    warn: LoggerFunc
}

const logger: Logger = {
    error: msg => {
        let str = ''
        if (_.isError(msg)) {
            str = msg.message
            let stack = msg.stack || ''
            stack = stack.slice(stack.indexOf('\n') + 1)
            str +=
                '\n' +
                cleanstack(stack, { pretty: true, basePath: process.cwd() })
        } else str = msg
        return loggers.get('error').log('error', str)
    },
    out: msg => loggers.get('out').log('out', msg),
    warn: msg => loggers.get('warn').log('warn', msg),
}

export default logger
