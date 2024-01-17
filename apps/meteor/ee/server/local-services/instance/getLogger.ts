import { pino } from 'pino';

export function getLogger({ MOLECULER_LOG_LEVEL: level, NODE_ENV: mode }: Record<string, unknown> = {}) {
	if (!level || typeof level !== 'string') {
		return {};
	}

	if (!['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(level)) {
		return {};
	}

	return {
		logger: {
			type: 'Pino',
			options: {
				level,
				pino: {
					options: {
						timestamp: pino.stdTimeFunctions.isoTime,
						...(mode !== 'production'
							? {
									transport: {
										target: 'pino-pretty',
										options: {
											colorize: true,
										},
									},
							  }
							: {}),
					},
				},
			},
		},
	};
}
