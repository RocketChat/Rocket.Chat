import type { IMessage } from '../../../../../definition/IMessage';
import type { IRoom } from '../../../../../definition/IRoom';

export type ChatEndpoints = {
	'chat.getMessage': {
		GET: (params: { msgId: IMessage['_id'] }) => {
			message: IMessage;
		};
	};
	'chat.followMessage': {
		POST: (payload: { mid: IMessage['_id'] }) => void;
	};
	'chat.unfollowMessage': {
		POST: (payload: { mid: IMessage['_id'] }) => void;
	};
	'chat.getDiscussions': {
		GET: (params: { roomId: IRoom['_id']; text?: string; offset: number; count: number }) => {
			messages: IMessage[];
			total: number;
		};
	};
	'chat.getThreadsList': {
		GET: (params: {
			rid: IRoom['_id'];
			type: 'unread' | 'following' | 'all';
			text?: string;
			offset: number;
			count: number;
		}) => {
			threads: IMessage[];
			total: number;
		};
	};
};
