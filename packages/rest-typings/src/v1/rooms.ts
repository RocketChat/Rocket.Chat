import type { IMessage, IRoom, IUser, RoomAdminFieldsType } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type RoomsEndpoints = {
	'rooms.autocomplete.channelAndPrivate': {
		GET: (params: { selector: string }) => {
			items: IRoom[];
		};
	};
	'rooms.autocomplete.channelAndPrivate.withPagination': {
		GET: (params: { selector: string; offset?: number; count?: number; sort?: string }) => {
			items: IRoom[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'rooms.autocomplete.availableForTeams': {
		GET: (params: { name: string }) => {
			items: IRoom[];
		};
	};
	'rooms.info': {
		GET: (params: { roomId: string } | { roomName: string }) => {
			room: IRoom;
		};
	};
	'rooms.createDiscussion': {
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
	'rooms.export': {
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
	'rooms.adminRooms': {
		GET: (
			params: PaginatedRequest<{
				filter?: string;
				types?: string[];
			}>,
		) => PaginatedResult<{ rooms: Pick<IRoom, RoomAdminFieldsType>[] }>;
	};
	'rooms.adminRooms.getRoom': {
		GET: (params: { rid?: string }) => Pick<IRoom, RoomAdminFieldsType>;
	};
	'rooms.saveRoomSettings': {
		POST: (params: {
			rid: string;
			roomAvatar?: string;
			featured?: boolean;
			roomName?: string;
			roomTopic?: string;
			roomAnnouncement?: string;
			roomDescription?: string;
			roomType?: IRoom['t'];
			readOnly?: boolean;
			reactWhenReadOnly?: boolean;
			default?: boolean;
			tokenpass?: string;
			encrypted?: boolean;
			favorite?: {
				defaultValue?: boolean;
				favorite?: boolean;
			};
		}) => {
			success: boolean;
			rid: string;
		};
	};
	'rooms.changeArchivationState': {
		POST: (params: { rid: string; action?: string }) => {
			success: boolean;
		};
	};
};
