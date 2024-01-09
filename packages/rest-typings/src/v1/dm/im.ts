import type { IMessage, IRoom, IUser, IUploadWithUser } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { DmCloseProps } from './DmCloseProps';
import type { DmCreateProps } from './DmCreateProps';
import type { DmDeleteProps } from './DmDeleteProps';
import type { DmFileProps } from './DmFileProps';
import type { DmHistoryProps } from './DmHistoryProps';
import type { DmLeaveProps } from './DmLeaveProps';
import type { DmMemberProps } from './DmMembersProps';
import type { DmMessagesProps } from './DmMessagesProps';

export type ImEndpoints = {
	'/v1/im.create': {
		POST: (params: DmCreateProps) => {
			room: IRoom & { rid: IRoom['_id'] };
		};
	};
	'/v1/im.delete': {
		POST: (params: DmDeleteProps) => void;
	};
	'/v1/im.close': {
		POST: (params: DmCloseProps) => void;
	};
	'/v1/im.kick': {
		POST: (params: DmCloseProps) => void;
	};
	'/v1/im.leave': {
		POST: (params: DmLeaveProps) => void;
	};
	'/v1/im.counters': {
		GET: (params: { roomId: string; userId?: string }) => {
			joined: boolean;
			unreads: number | null;
			unreadsFrom: string | null;
			msgs: number | null;
			members: number | null;
			latest: string | null;
			userMentions: number | null;
		};
	};
	'/v1/im.files': {
		GET: (params: DmFileProps) => PaginatedResult<{
			files: IUploadWithUser[];
		}>;
	};
	'/v1/im.history': {
		GET: (params: DmHistoryProps) => {
			messages: Pick<IMessage, '_id' | 'rid' | 'msg' | 'ts' | '_updatedAt' | 'u'>[];
		};
	};

	'/v1/im.members': {
		GET: (params: DmMemberProps) => PaginatedResult<{
			members: (Pick<IUser, '_id' | 'status' | 'name' | 'username' | 'utcOffset'> & { isMuted: boolean })[];
		}>;
	};
	'/v1/im.messages': {
		GET: (params: DmMessagesProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/im.messages.others': {
		GET: (params: PaginatedRequest<{ roomId: IRoom['_id']; query?: string; fields?: string }>) => PaginatedResult<{ messages: IMessage[] }>;
	};
	'/v1/im.list': {
		GET: (params: PaginatedRequest<{ fields?: string }>) => PaginatedResult<{ ims: IRoom[] }>;
	};
	'/v1/im.list.everyone': {
		GET: (params: PaginatedRequest<{ query: string; fields?: string }>) => PaginatedResult<{ ims: IRoom[] }>;
	};
	'/v1/im.open': {
		POST: (params: { roomId: string }) => void;
	};
	'/v1/im.setTopic': {
		POST: (params: { roomId: string; topic?: string }) => {
			topic?: string;
		};
	};
};
