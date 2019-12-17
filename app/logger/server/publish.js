import { EventEmitter } from 'events';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { EJSON } from 'meteor/ejson';
import { Log } from 'meteor/logging';

import { settings } from '../../settings';
import { hasPermission } from '../../authorization/server';

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

const stdoutStreamer = new Meteor.Streamer('stdout');
stdoutStreamer.allowWrite('none');
stdoutStreamer.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-logs') : false;
});

const listenAndEmitStdout = () => {
	const handler = (string, item) => {
		stdoutStreamer.emit('stdout', {
			...item,
		});
	};
	StdOut.on('write', handler);
};

Meteor.startup(() => listenAndEmitStdout());

Meteor.publish('stdout', function() {
	console.warn('The publication "stdout" is deprecated and will be removed after version v4.0.0');
	if (!this.userId || hasPermission(this.userId, 'view-logs') !== true) {
		return this.ready();
	}
	const handler = (string, item) => {
		this.added('stdout', item.id, {
			string: item.string,
			ts: item.ts,
		});
	};

	StdOut.queue.forEach((item) => handler('', item));

	this.ready();

	this.onStop(() => StdOut.removeListener('write', handler));

	StdOut.on('write', handler);
});
