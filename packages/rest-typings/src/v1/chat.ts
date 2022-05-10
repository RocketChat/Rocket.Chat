import type { IMessage, IRoom, ReadReceipt } from '@rocket.chat/core-typings';

export type ChatEndpoints = {
	'/v1/chat.getMessage': {
		GET: (params: { msgId: IMessage['_id'] }) => {
			message: IMessage;
		};
	};
	'/v1/chat.followMessage': {
		POST: (params: { mid: IMessage['_id'] }) => void;
	};
	'/v1/chat.unfollowMessage': {
		POST: (params: { mid: IMessage['_id'] }) => void;
	};
	'/v1/chat.starMessage': {
		POST: (params: { messageId: IMessage['_id'] }) => void;
	};
	'/v1/chat.unStarMessage': {
		POST: (params: { messageId: IMessage['_id'] }) => void;
	};
	'/v1/chat.pinMessage': {
		POST: (params: { messageId: IMessage['_id'] }) => void;
	};
	'/v1/chat.unPinMessage': {
		POST: (params: { messageId: IMessage['_id'] }) => void;
	};
	'/v1/chat.reportMessage': {
		POST: (params: { messageId: IMessage['_id']; description: string }) => void;
	};
	'/v1/chat.getDiscussions': {
		GET: (params: { roomId: IRoom['_id']; text?: string; offset: number; count: number }) => {
			messages: IMessage[];
			total: number;
		};
	};
	'/v1/chat.getThreadsList': {
		GET: (params: { rid: IRoom['_id']; type: 'unread' | 'following' | 'all'; text?: string; offset: number; count: number }) => {
			threads: IMessage[];
			total: number;
		};
	};
	'/v1/chat.syncThreadsList': {
		GET: (params: { rid: IRoom['_id']; updatedSince: string }) => {
			threads: {
				update: IMessage[];
				remove: IMessage[];
			};
		};
	};
	'/v1/chat.delete': {
		POST: (params: { msgId: string; roomId: string }) => {
			_id: string;
			ts: string;
			message: Pick<IMessage, '_id' | 'rid' | 'u'>;
		};
	};
	'/v1/chat.react': {
		POST: (params: { emoji: string; messageId: string } | { reaction: string; messageId: string }) => void;
	};
	'/v1/chat.ignoreUser': {
		GET: (params: { rid: string; userId: string; ignore: boolean }) => {};
	};
	'/v1/chat.search': {
		GET: (params: { roomId: IRoom['_id']; searchText: string; count: number; offset: number }) => {
			messages: IMessage[];
		};
	};
	'/v1/chat.update': {
		POST: (params: { roomId: IRoom['_id']; msgId: string; text: string }) => {
			messages: IMessage;
		};
	};
	'/v1/chat.getMessageReadReceipts': {
		GET: (params: { messageId: string }) => { receipts: ReadReceipt[] };
	};
};
