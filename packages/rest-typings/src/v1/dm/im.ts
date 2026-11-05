import type { IMessage, IRoom, ISubscription, IUploadWithUser, IUser } from '@rocket.chat/core-typings';

import type { DmBlockUserProps } from './DmBlockUserProps.js';
import type { DmCreateProps } from './DmCreateProps.js';
import type { DmFileProps } from './DmFileProps.js';
import type { DmHistoryProps } from './DmHistoryProps.js';
import type { DmLeaveProps } from './DmLeaveProps.js';
import type { DmMemberProps } from './DmMembersProps.js';
import type { DmMessagesProps } from './DmMessagesProps.js';
import type { PaginatedResult } from '../../helpers/PaginatedResult.js';

type DmKickProps = {
	roomId: string;
};

type DmCreateResult = Pick<IRoom, '_id' | 't' | 'usernames'> & { rid: IRoom['_id'] };

// Public mirror of the implementation-derived routes (apps/meteor/server/api/v1/im.ts,
// `ExtractRoutesFromAPI<typeof dmEndpoints>`). Kept identical so the two declarations merge
// without TS2320, and so SDK/external consumers that don't compile apps/meteor keep these routes.
// `im.kick` is the exception: still registered through the legacy API.v1.addRoute.
export type ImEndpoints = {
	'/v1/im.create': {
		POST: (params: DmCreateProps) => { room: DmCreateResult };
	};
	'/v1/im.delete': {
		POST: (params: { roomId: string } | { username: string }) => void;
	};
	'/v1/im.close': {
		POST: (params: { roomId: string }) => void;
	};
	'/v1/im.kick': {
		POST: (params: DmKickProps) => void;
	};
	'/v1/im.leave': {
		POST: (params: DmLeaveProps) => void;
	};
	'/v1/im.open': {
		POST: (params: { roomId: string }) => void;
	};
	'/v1/im.setTopic': {
		POST: (params: { roomId: string; topic?: string }) => { topic?: string };
	};
	'/v1/im.blockUser': {
		POST: (params: DmBlockUserProps) => void;
	};
	'/v1/im.counters': {
		GET: (params: { roomId: string; userId?: string }) => {
			joined: boolean;
			members: number | null;
			unreads: number | null;
			unreadsFrom: string | null;
			msgs: number | null;
			latest: string | null;
			userMentions: number | null;
		};
	};
	'/v1/im.files': {
		GET: (params: DmFileProps) => PaginatedResult<{
			files: IUploadWithUser[];
		}>;
	};
	'/v1/im.members': {
		GET: (params: DmMemberProps) => PaginatedResult<{
			members: (Pick<IUser, '_id' | 'status' | 'statusText' | 'name' | 'username' | 'utcOffset' | 'federated' | 'sipExtension'> & {
				subscription: Partial<Pick<ISubscription, '_id' | 'status' | 'ts' | 'roles'>>;
			})[];
		}>;
	};
	'/v1/im.messages': {
		GET: (params: DmMessagesProps) => { messages: IMessage[]; count: number; offset: number; total: number };
	};
	'/v1/im.history': {
		GET: (params: DmHistoryProps) => { messages: IMessage[]; firstUnread?: IMessage; unreadNotLoaded?: number };
	};
	'/v1/im.messages.others': {
		GET: (params?: never) => { messages: IMessage[]; offset: number; count: number; total: number };
	};
	'/v1/im.list': {
		GET: (params?: never) => { ims: IRoom[]; offset: number; count: number; total: number };
	};
	'/v1/im.list.everyone': {
		GET: (params?: never) => { ims: IRoom[]; offset: number; count: number; total: number };
	};
};
