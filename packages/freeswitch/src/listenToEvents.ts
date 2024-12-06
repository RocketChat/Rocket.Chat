import type { FreeSwitchResponse } from 'esl';

import { connect, type EventNames } from './connect';

export async function listenToEvents(
	callback: (eventName: string, data: Record<string, string | undefined>) => Promise<void>,
	options?: { host?: string; port?: number; password?: string },
): Promise<FreeSwitchResponse> {
	const eventsToListen: EventNames = [
		'CHANNEL_CALLSTATE',
		'CHANNEL_STATE',
		'CHANNEL_CREATE',
		'CHANNEL_DESTROY',
		'CHANNEL_ANSWER',
		'CHANNEL_HANGUP',
		'CHANNEL_HANGUP_COMPLETE',
		'CHANNEL_BRIDGE',
		'CHANNEL_UNBRIDGE',
		'CHANNEL_OUTGOING',
		'CHANNEL_PARK',
		'CHANNEL_UNPARK',
		'CHANNEL_HOLD',
		'CHANNEL_UNHOLD',
		'CHANNEL_ORIGINATE',
		'CHANNEL_UUID',
	];

	const connection = await connect(options, eventsToListen);

	eventsToListen.forEach((eventName) =>
		connection.on(eventName, (event) => {
			callback(eventName, event.body);
		}),
	);

	return connection;
}
