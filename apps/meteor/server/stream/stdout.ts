import { performance } from 'perf_hooks';

import { EJSON } from 'meteor/ejson';
import { Log } from 'meteor/logging';

import notifications from '../../app/notifications/server/lib/Notifications';
import { getQueuedLogs, logEntries } from '../lib/logger/logQueue';

function processString(string: string, date: Date): string {
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
}

function rawTransformLog(item: any): { id: string; string: string; ts: Date; time?: number } {
	return {
		id: item.id,
		string: processString(item.data, item.ts),
		ts: item.ts,
	};
}

function timedTransformLog(log: any): { id: string; string: string; ts: Date; time?: number } {
	const timeStart = performance.now();
	const item = rawTransformLog(log);
	const timeEnd = performance.now();

	item.time = timeEnd - timeStart;

	return item;
}

const transformLog = process.env.STDOUT_METRICS === 'true' ? timedTransformLog : rawTransformLog;

logEntries.on('log', (item) => {
	// TODO having this as 'emitWithoutBroadcast' will not sent this data to ddp-streamer, so this data
	// won't be available when using micro services.
	notifications.streamStdout.emitWithoutBroadcast('stdout', transformLog(item));
});

export function getLogs(): { id: string; string: string; ts: Date }[] {
	return getQueuedLogs().map(transformLog);
}
