import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type RoomsEndpoints = {
	'/v1/rooms.autocomplete.channelAndPrivate': {
		GET: (params: { selector: string }) => {
			items: IRoom[];
		};
	};
	'/v1/rooms.autocomplete.channelAndPrivate.withPagination': {
		GET: (params: PaginatedRequest<{ selector: string }>) => PaginatedResult<{
			items: IRoom[];
		}>;
	};
	'/v1/rooms.autocomplete.availableForTeams': {
		GET: (params: { name: string }) => {
			items: IRoom[];
		};
	};
	'/v1/rooms.info': {
		GET: (params: { roomId: string } | { roomName: string }) => {
			room: IRoom;
		};
	};
	'/v1/rooms.createDiscussion': {
		POST: (params: {
			prid: IRoom['_id'];
			pmid?: IMessage['_id'];
			t_name: IRoom['fname'];
			users?: IUser['username'][];
			encrypted?: boolean;
			reply?: string;
		}) => {
			discussion: IRoom;
		};
	};
	'/v1/rooms.export': {
		POST: (params: {
			rid: IRoom['_id'];
			type: 'email' | 'file';
			toUsers?: IUser['username'][];
			toEmails?: string[];
			additionalEmails?: string;
			subject?: string;
			messages?: IMessage['_id'][];
			dateFrom?: string;
			dateTo?: string;
			format?: 'html' | 'json';
		}) => {
			missing?: [];
			success: boolean;
		};
	};
};
