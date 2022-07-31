import winston from 'winston'
const {
	loggers,
	transports: { Console },
	format: { colorize, combine, timestamp, printf },
} = winston

const logFormat = [
	printf(info => {
		const { level, message } = info
		if (['error', 'warn'].includes(level)) return level + ' ' + message
		return message
	}),
]
loggers.add('error', {
	levels: { error: 0 },
	transports: [ new Console({ level: 'error' }) ],
	format: combine(colorize({ colors: { error: 'red' } }), ...logFormat),
})

loggers.add('out', {
	levels: {out: 1},
	transports: [ new Console({ level: 'out' }) ],
	format: combine(...logFormat)
})

loggers.add('warn', {
	levels: {warn: 1},
	transports: [ new Console({ level: 'warn' }) ],
	format: combine(...logFormat)
})

type LoggerFunc = (msg:string) => winston.Logger
type Logger = {
	error: LoggerFunc
	out: LoggerFunc
	warn: LoggerFunc
}

export const logger= {
	error: msg => loggers.get('error').log('error', msg),
	out: msg => loggers.get('out').log('out', msg),
	warn: msg => loggers.get('warn').log('warn', msg),
} as any as Logger
