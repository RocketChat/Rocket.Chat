import { logger } from '../logger';
import { FreeSwitchESLClient, type EventNames, type FreeSwitchESLClientOptions } from './client';

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
	'CHANNEL_APPLICATION',
	'CHANNEL_PROGRESS',
	'CHANNEL_PROGRESS_MEDIA',
	'CALL_UPDATE',
];

export class FreeSwitchEventClient extends FreeSwitchESLClient {
	constructor(
		protected options: FreeSwitchESLClientOptions,
		private eventsToListen: EventNames,
	) {
		super(options);

		eventsToListen.forEach((eventName) => {
			this.response.on(eventName, (eventData) => this.emit('event', { eventName, eventData: eventData.body }));
		});
	}

	protected async transitionToReady(): Promise<void> {
		try {
			this.response.event_json(...this.eventsToListen);
		} catch (error) {
			logger.error({ msg: 'Failed to request events', error });
			throw new Error('failed-to-request-events');
		}

		super.transitionToReady();
	}

	public static listenToEvents(options: FreeSwitchESLClientOptions): FreeSwitchEventClient {
		return new FreeSwitchEventClient(options, eventsToListen);
	}
}
