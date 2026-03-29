import type { IMessage } from './IMessage';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export interface INotificationHistory {
	_id: string;
	userId: IUser['_id'];
	roomId: IRoom['_id'];
	msgId: IMessage['_id'];
	roomName?: string;
	message: string;
	type: 'general' | 'direct' | 'mention' | 'reaction' | 'star' | 'quote' | 'thread';	
    ts: Date;
	_updatedAt: Date;
}