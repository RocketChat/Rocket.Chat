import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export enum ExternalPresence {
	ONLINE = 'online',
	OFFLINE = 'offline',
	UNAVAILABLE = 'unavailable',
};

export interface IMatrixEventContentUserPresenceChanged extends IBaseEventContent {
	currently_active: boolean;
	last_active_ago: number;
	presence: ExternalPresence;
	status_msg?: string;
	avatar_url?: string;
}

export class MatrixEventUserPresenceChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentUserPresenceChanged;

	public type = MatrixEventType.USER_PRESENCE_CHANGED;
}
