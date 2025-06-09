import type { FreeSwitchResponse } from 'esl';

import { connect, type EventNames } from './connect';

export async function listenToEvents(
	callback: (eventName: string, data: Record<string, string | undefined>) => Promise<void>,
	options?: { host?: string; port?: number; password?: string },
): Promise<FreeSwitchResponse> {
	const eventsToListen: EventNames = [
		'CHANNEL_CREATE',
		'CHANNEL_DESTROY',
		'CHANNEL_STATE',
		'CHANNEL_CALLSTATE',
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

		'CHANNEL_APPLICATION',
		// 'CHANNEL_EXECUTE',
		// 'CHANNEL_EXECUTE_COMPLETE',
		'CHANNEL_PROGRESS',
		'CHANNEL_PROGRESS_MEDIA',

		'CALL_UPDATE',

		// Codec and Presence events might give extra insight into call negotiation, but so far I found no need for them;
		// 'CODEC',
		// 'PRESENCE_IN',
		// 'PRESENCE_OUT',
	];

	// CALL_SECURE and RECV_RTCP_MESSAGE events might be VERY useful for debugging, but they don't follow the CHANNEL_* format

	const connection = await connect(options, eventsToListen);

	eventsToListen.forEach((eventName) =>
		connection.on(eventName, (event) => {
			// console.log(eventName, event.body['Event-Sequence']);
			callback(eventName, event.body);
		}),
	);

	return connection;
}
