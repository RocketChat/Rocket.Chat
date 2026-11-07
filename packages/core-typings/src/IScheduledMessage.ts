import type { IMessage } from './IMessage';
import type { IUser } from './IUser';

export interface IScheduledMessage extends IMessage {
	deliverAt: Date;
	scheduledBy?: IUser;
	status: 'pending' | 'processing' | 'sent' | 'cancelled' | 'failed';
	sentAt?: Date;
	errorReason?: string;
}
