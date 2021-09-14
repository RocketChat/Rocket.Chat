import { EJSON } from 'meteor/ejson';
import { Log } from 'meteor/logging';

import { settings } from '../../app/settings/server';
import notifications from '../../app/notifications/server/lib/Notifications';

type LogQueue = {
	id: string;
	string: string;
	ts: Date;
};

const queue: LogQueue[] = [];

export function getQueue(): LogQueue[] {
	return queue;
}

const maxInt = 2147483647;
let queueSize = 0;

const processString = function(string: string, date: Date): string {
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

const { write } = process.stdout;

function queueWrite(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean;
function queueWrite(str: Uint8Array | string, encoding?: string, cb?: (err?: Error) => void): boolean;
function queueWrite(...args: any): boolean {
	write.apply(process.stdout, args);

	const [str] = args;
	if (typeof str !== 'string') {
		return false;
	}

	const date = new Date();
	const string = processString(str, date);
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

	// TODO having this as 'emitWithoutBroadcast' will not sent this data to ddp-streamer, so this data
	// won't be available when using micro services.
	notifications.streamStdout.emitWithoutBroadcast('stdout', {
		...item,
	});

	return true;
}

if (String(process.env.MOLECULER_LOG_LEVEL).toLowerCase() !== 'debug') {
	process.stdout.write = queueWrite;
}
