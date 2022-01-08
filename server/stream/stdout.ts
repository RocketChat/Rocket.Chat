import { EJSON } from 'meteor/ejson';
import { Log } from 'meteor/logging';

import notifications from '../../app/notifications/server/lib/Notifications';
import { getQueuedLogs, logEntries } from '../lib/logger/logQueue';

const processString = function (string: string, date: Date): string {
	try {
		const obj = EJSON.parse(string);

		if (typeof obj !== 'object' || obj === null) {
			throw new TypeError();
		}

		if ('toJSONValue' in obj) {
			return Log.format(obj.toJSONValue(), { color: true });
		}

		if (!Array.isArray(obj) && !(obj instanceof Date) && !(obj instanceof Uint8Array)) {
			return Log.format(obj, { color: true });
		}
	} catch (error) {
		return string;
	}

	return Log.format(
		{
			message: string,
			time: date,
			level: 'info',
		},
		{ color: true },
	);
};

const transformLog = function (item: { id: string; data: string; ts: Date }): { id: string; string: string; ts: Date } {
	return {
		id: item.id,
		string: processString(item.data, item.ts),
		ts: item.ts,
	};
};

logEntries.on('log', (item) => {
	// TODO having this as 'emitWithoutBroadcast' will not sent this data to ddp-streamer, so this data
	// won't be available when using micro services.
	notifications.streamStdout.emitWithoutBroadcast('stdout', transformLog(item));
});

export function getLogs(): { id: string; string: string; ts: Date }[] {
	return getQueuedLogs().map(transformLog);
}
