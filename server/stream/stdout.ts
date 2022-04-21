import { EJSON } from 'meteor/ejson';
import { Log } from 'meteor/logging';

import notifications from '../../app/notifications/server/lib/Notifications';
import { getQueuedLogs, logEntries } from '../lib/logger/logQueue';

interface ILog {
	id: string;
	string: string;
	ts: Date;
}
interface ITransformLog {
	id: string;
	data: string;
	ts: Date;
}

const processString = function (string: string, date: Date): string {
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

const transformLog = function (item: ITransformLog): ILog {
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

export function getLogs(): ILog[] {
	return getQueuedLogs().map(transformLog);
}
