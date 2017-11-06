/* globals SystemLogger */

const logLevels = {
	ERROR_ONLY: 0,
	INFO: 1,
	DEBUG: 2
};

class ClientLogger {

	constructor(logLevel) {
		this.logLevel = logLevel;

		const self = this;

		const methods = {
			debug: {
				name: 'debug',
				level: 2
			},
			log: {
				name: 'info',
				level: 1
			},
			info: {
				name: 'info',
				level: 1
			},
			success: {
				name: 'info',
				level: 1
			},
			warn: {
				name: 'warn',
				level: 1
			},
			error: {
				name: 'error',
				level: 0
			}
		};

		this._log = function(options) {
			if (options.level == null) {
				options.level = 1;
			}

			if (self.logLevel < options.level) {
				return;
			}
			console.log.apply(console, options.arguments);
		};


		_.each(methods, (typeConfig, type) => {
			this[type] = function(...args) {
				return self._log.call(self, {
					type,
					level: typeConfig.level,
					method: typeConfig.name,
					'arguments': args
				});
			};
		});
	}
}

/**
 * This function provides a harmonized interface for client- and serverside logging.
 * It
 * @return {Logger}
 */
export function getLogger() {
	const logLevel = logLevels.ERROR_ONLY;
	return Meteor.isServer ? SystemLogger : new ClientLogger(logLevel);
}
