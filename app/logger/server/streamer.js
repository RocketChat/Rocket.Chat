import { EventEmitter } from 'events';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { EJSON } from 'meteor/ejson';
import { Log } from 'meteor/logging';

import { settings } from '../../settings';
import notifications from '../../notifications/server/lib/Notifications';

export const processString = function(string, date) {
	let obj;
	try {
		if (string[0] === '{') {
			obj = EJSON.parse(string);
		} else {
			obj = {
				message: string,
				time: date,
				level: 'info',
			};
		}
		return Log.format(obj, { color: true });
	} catch (error) {
		return string;
	}
};

export const StdOut = new class extends EventEmitter {
	constructor() {
		super();
		const { write } = process.stdout;
		this.queue = [];
		process.stdout.write = (...args) => {
			write.apply(process.stdout, args);
			const date = new Date();
			const string = processString(args[0], date);
			const item = {
				id: Random.id(),
				string,
				ts: date,
			};
			this.queue.push(item);

			const limit = settings.get('Log_View_Limit') || 1000;
			if (limit && this.queue.length > limit) {
				this.queue.shift();
			}

			this.emit('write', string, item);
		};
	}
}();

Meteor.startup(() => {
	const handler = (string, item) => {
		// TODO having this as 'emitWithoutBroadcast' will not sent this data to ddp-streamer, so this data
		// won't be available when using micro services.
		notifications.streamStdout.emitWithoutBroadcast('stdout', {
			...item,
		});
	};

	// do not emit to StdOut if moleculer log level set to debug because it creates an infinite loop
	if (String(process.env.MOLECULER_LOG_LEVEL).toLowerCase() !== 'debug') {
		StdOut.on('write', handler);
	}
});
