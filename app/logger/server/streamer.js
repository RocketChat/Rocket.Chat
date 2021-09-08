import { EventEmitter } from 'events';

import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { Log } from 'meteor/logging';

import { settings } from '../../settings/server';
import notifications from '../../notifications/server/lib/Notifications';

const processString = function(string, date) {
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

export const StdOut = new EventEmitter();

const { write } = process.stdout;

const queue = [];

const maxInt = 2147483647;
let queueSize = 0;

process.stdout.write = (...args) => {
	write.apply(process.stdout, args);
	const date = new Date();
	const string = processString(args[0], date);
	const item = {
		id: `logid-${ queueSize }`,
		string,
		ts: date,
	};
	queue.push(item);

	queueSize = (queueSize + 1) & maxInt;

	const limit = settings.get('Log_View_Limit') || 1000;
	if (queueSize > limit) {
		queue.shift();
	}

	StdOut.emit('write', string, item);
};

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
