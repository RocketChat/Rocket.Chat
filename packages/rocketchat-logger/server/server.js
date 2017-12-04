/* globals EventEmitter LoggerManager SystemLogger Log*/
import _ from 'underscore';
import s from 'underscore.string';

//TODO: change this global to import
LoggerManager = new class extends EventEmitter { // eslint-disable-line no-undef
	constructor() {
		super();
		this.enabled = false;
		this.loggers = {};
		this.queue = [];
		this.showPackage = false;
		this.showFileAndLine = false;
		this.logLevel = 0;
	}
	register(logger) {
		if (!logger instanceof Logger) {
			return;
		}
		this.loggers[logger.name] = logger;
		this.emit('register', logger);
	}
	addToQueue(logger, args) {
		this.queue.push({
			logger, args
		});
	}
	dispatchQueue() {
		_.each(this.queue, (item) => item.logger._log.apply(item.logger, item.args));
		this.clearQueue();
	}
	clearQueue() {
		this.queue = [];
	}

	disable() {
		this.enabled = false;
	}

	enable(dispatchQueue = false) {
		this.enabled = true;
		return (dispatchQueue === true) ? this.dispatchQueue() : this.clearQueue();
	}
};



const defaultTypes = {
	debug: {
		name: 'debug',
		color: 'blue',
		level: 2
	},
	log: {
		name: 'info',
		color: 'blue',
		level: 1
	},
	info: {
		name: 'info',
		color: 'blue',
		level: 1
	},
	success: {
		name: 'info',
		color: 'green',
		level: 1
	},
	warn: {
		name: 'warn',
		color: 'magenta',
		level: 1
	},
	error: {
		name: 'error',
		color: 'red',
		level: 0
	}
};

class _Logger {
	constructor(name, config = {}) {
		const self = this;
		this.name = name;

		this.config = Object.assign({}, config);
		if (LoggerManager.loggers && LoggerManager.loggers[this.name] != null) {
			LoggerManager.loggers[this.name].warn('Duplicated instance');
			return LoggerManager.loggers[this.name];
		}
		_.each(defaultTypes, (typeConfig, type) => {
			this[type] = function(...args) {
				return self._log.call(self, {
					section: this.__section,
					type,
					level: typeConfig.level,
					method: typeConfig.name,
					'arguments': args
				});
			};

			self[`${ type }_box`] = function(...args) {
				return self._log.call(self, {
					section: this.__section,
					type,
					box: true,
					level: typeConfig.level,
					method: typeConfig.name,
					'arguments': args
				});
			};
		});
		if (this.config.methods) {
			_.each(this.config.methods, (typeConfig, method) => {
				if (this[method] != null) {
					self.warn(`Method ${ method } already exists`);
				}
				if (defaultTypes[typeConfig.type] == null) {
					self.warn(`Method type ${ typeConfig.type } does not exist`);
				}
				this[method] = function(...args) {
					return self._log.call(self, {
						section: this.__section,
						type: typeConfig.type,
						level: typeConfig.level != null ? typeConfig.level : defaultTypes[typeConfig.type] && defaultTypes[typeConfig.type].level,
						method,
						'arguments': args
					});
				};
				this[`${ method }_box`] = function(...args) {
					return self._log.call(self, {
						section: this.__section,
						type: typeConfig.type,
						box: true,
						level: typeConfig.level != null ? typeConfig.level : defaultTypes[typeConfig.type] && defaultTypes[typeConfig.type].level,
						method,
						'arguments': args
					});
				};
			});
		}
		if (this.config.sections) {
			_.each(this.config.sections, (name, section) => {
				this[section] = {};
				_.each(defaultTypes, (typeConfig, type) => {
					self[section][type] = (...args) => this[type].apply({__section: name}, args);
					self[section][`${ type }_box`] = (...args) => this[`${ type }_box`].apply({__section: name}, args);
				});
				_.each(this.config.methods, (typeConfig, method) => {
					self[section][method] = (...args) => self[method].apply({__section: name}, args);
					self[section][`${ method }_box`] = (...args) => self[`${ method }_box`].apply({__section: name}, args);
				});
			});
		}

		LoggerManager.register(this);
	}
	getPrefix(options) {
		let prefix = `${ this.name } ➔ ${ options.method }`;
		if (options.section) {
			prefix = `${ this.name } ➔ ${ options.section }.${ options.method }`;
		}
		const details = this._getCallerDetails();
		const detailParts = [];
		if (details['package'] && (LoggerManager.showPackage === true || options.type === 'error')) {
			detailParts.push(details['package']);
		}
		if (LoggerManager.showFileAndLine === true || options.type === 'error') {
			if ((details.file != null) && (details.line != null)) {
				detailParts.push(`${ details.file }:${ details.line }`);
			} else {
				if (details.file != null) {
					detailParts.push(details.file);
				}
				if (details.line != null) {
					detailParts.push(details.line);
				}
			}
		}
		if (defaultTypes[options.type]) {
			// format the message to a colored message
			prefix = prefix[defaultTypes[options.type].color];
		}
		if (detailParts.length > 0) {
			prefix = `${ detailParts.join(' ') } ${ prefix }`;
		}
		return prefix;
	}
	_getCallerDetails() {
		const getStack = () => {
			// We do NOT use Error.prepareStackTrace here (a V8 extension that gets us a
			// core-parsed stack) since it's impossible to compose it with the use of
			// Error.prepareStackTrace used on the server for source maps.
			const {stack} = new Error();
			return stack;
		};
		const stack = getStack();
		if (!stack) {
			return {};
		}
		const lines = stack.split('\n').splice(1);
		// looking for the first line outside the logging package (or an
		// eval if we find that first)
		let line = lines[0];
		for (let index = 0, len = lines.length; index < len, index++; line = lines[index]) {
			if (line.match(/^\s*at eval \(eval/)) {
				return {file: 'eval'};
			}

			if (!line.match(/packages\/rocketchat_logger(?:\/|\.js)/)) {
				break;
			}
		}

		const details = {};
		// The format for FF is 'functionName@filePath:lineNumber'
		// The format for V8 is 'functionName (packages/logging/logging.js:81)' or
		//                      'packages/logging/logging.js:81'
		const match = /(?:[@(]| at )([^(]+?):([0-9:]+)(?:\)|$)/.exec(line);
		if (!match) {
			return details;
		}
		details.line = match[2].split(':')[0];
		// Possible format: https://foo.bar.com/scripts/file.js?random=foobar
		// XXX: if you can write the following in better way, please do it
		// XXX: what about evals?
		details.file = match[1].split('/').slice(-1)[0].split('?')[0];
		const packageMatch = match[1].match(/packages\/([^\.\/]+)(?:\/|\.)/);
		if (packageMatch) {
			details['package'] = packageMatch[1];
		}
		return details;
	}
	makeABox(message, title) {
		if (!_.isArray(message)) {
			message = message.split('\n');
		}
		let len = 0;

		len = Math.max.apply(null, message.map(line => line.length));

		const topLine = `+--${ s.pad('', len, '-') }--+`;
		const separator = `|  ${ s.pad('', len, '') }  |`;
		let lines = [];

		lines.push(topLine);
		if (title) {
			lines.push(`|  ${ s.lrpad(title, len) }  |`);
			lines.push(topLine);
		}
		lines.push(separator);

		lines = [...lines, ...message.map(line => `|  ${ s.rpad(line, len) }  |`)];

		lines.push(separator);
		lines.push(topLine);
		return lines;
	}

	_log(options) {
		if (LoggerManager.enabled === false) {
			LoggerManager.addToQueue(this, arguments);
			return;
		}
		if (options.level == null) {
			options.level = 1;
		}

		if (LoggerManager.logLevel < options.level) {
			return;
		}

		const prefix = this.getPrefix(options);

		if (options.box === true && _.isString(options.arguments[0])) {
			let color = undefined;
			if (defaultTypes[options.type]) {
				color = defaultTypes[options.type].color;
			}

			const box = this.makeABox(options.arguments[0], options.arguments[1]);
			let subPrefix = '➔';
			if (color) {
				subPrefix = subPrefix[color];
			}

			console.log(subPrefix, prefix);
			box.forEach(line => {
				console.log(subPrefix, color ? line[color]: line);
			});

		} else {
			options.arguments.unshift(prefix);
			console.log.apply(console, options.arguments);
		}
	}
}
// TODO: change this global to import
Logger = global.Logger = _Logger;
const processString = function(string, date) {
	let obj;
	try {
		if (string[0] === '{') {
			obj = EJSON.parse(string);
		} else {
			obj = {
				message: string,
				time: date,
				level: 'info'
			};
		}
		return Log.format(obj, {color: true});
	} catch (error) {
		return string;
	}
};
// TODO: change this global to import
SystemLogger = new Logger('System', { // eslint-disable-line no-undef
	methods: {
		startup: {
			type: 'success',
			level: 0
		}
	}
});


const StdOut = new class extends EventEmitter {
	constructor() {
		super();
		const write = process.stdout.write;
		this.queue = [];
		process.stdout.write = (...args) => {
			write.apply(process.stdout, args);
			const date = new Date;
			const string = processString(args[0], date);
			const item = {
				id: Random.id(),
				string,
				ts: date
			};
			this.queue.push(item);

			if (typeof RocketChat !== 'undefined') {
				const limit = RocketChat.settings.get('Log_View_Limit');
				if (limit && this.queue.length > limit) {
					this.queue.shift();
				}
			}
			this.emit('write', string, item);
		};
	}
};


Meteor.publish('stdout', function() {
	if (!this.userId || RocketChat.authz.hasPermission(this.userId, 'view-logs') !== true) {
		return this.ready();
	}

	StdOut.queue.forEach(item => {
		this.added('stdout', item.id, {
			string: item.string,
			ts: item.ts
		});
	});

	this.ready();
	StdOut.on('write', (string, item) => {
		this.added('stdout', item.id, {
			string: item.string,
			ts: item.ts
		});
	});
});


export { SystemLogger, StdOut, LoggerManager, processString, Logger };
