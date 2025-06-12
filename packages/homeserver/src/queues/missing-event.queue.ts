import { injectable } from 'tsyringe';
import { BaseQueue } from './base.queue';

export type MissingEventType = {
	eventId: string;
	roomId: string;
	origin: string;
};

@injectable()
export class MissingEventsQueue extends BaseQueue<MissingEventType> {}
