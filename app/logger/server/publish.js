import { EventEmitter } from 'events';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { EJSON } from 'meteor/ejson';
import { Log } from 'meteor/logging';

import { settings } from '../../settings';
import { hasPermission } from '../../authorization';

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

			if (typeof settings !== 'undefined') {
				const limit = settings.get('Log_View_Limit');
				if (limit && this.queue.length > limit) {
					this.queue.shift();
				}
			}
			this.emit('write', string, item);
		};
	}
}();


Meteor.publish('stdout', function() {
	if (!this.userId || hasPermission(this.userId, 'view-logs') !== true) {
		return this.ready();
	}

	StdOut.queue.forEach((item) => {
		this.added('stdout', item.id, {
			string: item.string,
			ts: item.ts,
		});
	});

	this.ready();
	StdOut.on('write', (string, item) => {
		this.added('stdout', item.id, {
			string: item.string,
			ts: item.ts,
		});
	});
});
