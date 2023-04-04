import { performance } from 'perf_hooks';

import { EJSON } from 'meteor/ejson';
import { Log } from 'meteor/logging';

import notifications from '../../app/notifications/server/lib/Notifications';
import { getQueuedLogs, logEntries } from '../lib/logger/logQueue';

const processString = (string: string, date: Date): string => {
	try {
		const obj = EJSON.parse(string);
		if (!obj || typeof obj !== 'object') {
			throw new TypeError('Invalid JSON');
		}

		if ('toJSONValue' in obj) {
			return Log.format(obj.toJSONValue(), { color: true });
		}

		if (!Array.isArray(obj) && !(obj instanceof Date) && !(obj instanceof Uint8Array)) {
			return Log.format(obj, { color: true });
		}
		return Log.format(
			{
				message: string,
				time: date,
				level: 'info',
			},
			{ color: true },
		);
	} catch (e) {
		return string;
	}
};

const rawTransformLog = (item: any): { id: string; string: string; ts: Date; time?: number } => {
	return {
		id: item.id,
		string: processString(item.data, item.ts),
		ts: item.ts,
	};
};

const timedTransformLog = (log: any): { id: string; string: string; ts: Date; time?: number } => {
	const timeStart = performance.now();
	const item = rawTransformLog(log);
	const timeEnd = performance.now();

	item.time = timeEnd - timeStart;

	return item;
};

const transformLog = process.env.STDOUT_METRICS === 'true' ? timedTransformLog : rawTransformLog;

logEntries.on('log', (item) => {
	// TODO having this as 'emitWithoutBroadcast' will not sent this data to ddp-streamer, so this data
	// won't be available when using micro services.
	notifications.streamStdout.emitWithoutBroadcast('stdout', transformLog(item));
});

export function getLogs(): {
	id: string;
	string: string;
	ts: Date;
}[] {
	return getQueuedLogs().map(transformLog);
}
