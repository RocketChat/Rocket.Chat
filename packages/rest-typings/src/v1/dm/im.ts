import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import type { DmLeaveProps } from './DmLeaveProps';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { PaginatedResult } from '../../helpers/PaginatedResult';

type DmKickProps = {
	roomId: string;
};

export type ImEndpoints = {
	'/v1/im.kick': {
		POST: (params: DmKickProps) => void;
	};
	'/v1/im.leave': {
		POST: (params: DmLeaveProps) => void;
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
};
