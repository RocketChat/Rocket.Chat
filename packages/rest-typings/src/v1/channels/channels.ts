import type { IMessage, IRoom, ITeam, IGetRoomRoles, IUser } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { ChannelsAddAllProps } from './ChannelsAddAllProps';
import type { ChannelsArchiveProps } from './ChannelsArchiveProps';
import type { ChannelsDeleteProps } from './ChannelsDeleteProps';
import type { ChannelsGetAllUserMentionsByChannelProps } from './ChannelsGetAllUserMentionsByChannelProps';
import type { ChannelsMessagesProps } from './ChannelsMessagesProps';
import type { ChannelsOpenProps } from './ChannelsOpenProps';
import type { ChannelsSetAnnouncementProps } from './ChannelsSetAnnouncementProps';
import type { ChannelsUnarchiveProps } from './ChannelsUnarchiveProps';

export type ChannelsEndpoints = {
	'channels.files': {
		GET: (params: PaginatedRequest<{ roomId: IRoom['_id'] } | { roomName: IRoom['name'] }>) => PaginatedResult<{
			files: IMessage[];
		}>;
	};
	'channels.members': {
		GET: (params: PaginatedRequest<{ roomId: IRoom['_id']; filter?: string; status?: string[] } | { roomName: IRoom['name']; filter?: string; status?: string[] }>) => PaginatedResult<{
			members: IUser[];
		}>;
	};
	'channels.history': {
		GET: (
			params: PaginatedRequest<{
				roomId: IRoom['_id'];
				latest?: string;
				showThreadMessages?: 'false' | 'true';
				oldest?: string;
				inclusive?: 'false' | 'true';
			} | 
			{
				roomName: IRoom['name'];
				latest?: string;
				showThreadMessages?: 'false' | 'true';
				oldest?: string;
				inclusive?: 'false' | 'true';
			}>,
		) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'channels.archive': {
		POST: (params: ChannelsArchiveProps) => void;
	};
	'channels.unarchive': {
		POST: (params: ChannelsUnarchiveProps) => void;
	};
	'channels.create': {
		POST: (params: {
			name: string;
			members: string[];
			readOnly: boolean;
			extraData: {
				broadcast: boolean;
				encrypted: boolean;
				teamId?: string;
			};
		}) => {
			group: Partial<IRoom>;
		};
	};
	'channels.convertToTeam': {
		POST: (params: { channelId: string; channelName: string }) => {
			team: ITeam;
		};
	};
	'channels.info': {
		GET: (params: { roomId: IRoom['_id'] } | { roomName: IRoom['name'] }) => { channel: IRoom };
	};
	'channels.counters': {
		GET: (params: { roomId: IRoom['_id'] } | { roomName: IRoom['name'] }) => {
			joined: boolean;
			members: number;
			unreads: number;
			unreadsFrom: Date;
			msgs: number;
			latest: Date;
			userMentions: number;
		};
	};
	'channels.join': {
		POST: (params: { roomId: IRoom['_id']; joinCode?: string }  | { roomName: IRoom['name']; joinCode?: string }) => {
			channel: IRoom;
		};
	};
	'channels.close': {
		POST: (params: { roomId: IRoom['_id'] } | { roomName: IRoom['name'] }) => {};
	};
	'channels.kick': {
		POST: (params: { roomId: IRoom['_id']; userId: IUser['_id'] } | { roomName: IRoom['name']; userId: IUser['_id'] }) => {};
	};
	'channels.delete': {
		POST: (params: ChannelsDeleteProps) => void;
	};
	'channels.leave': {
		POST: (params: { roomId: IRoom['_id'] } | { roomName: IRoom['name'] }) => {};
	};
	'channels.addModerator': {
		POST: (params: { roomId: IRoom['_id']; userId: IUser['_id'] } | { roomName: IRoom['name']; userId: IUser['_id'] }) => {};
	};
	'channels.removeModerator': {
		POST: (params: { roomId: IRoom['_id']; userId: IUser['_id'] | { roomName: IRoom['name']; userId: IUser['_id'] } }) => {};
	};
	'channels.addOwner': {
		POST: (params: { roomId: IRoom['_id']; userId: IUser['_id'] | { roomName: IRoom['name']; userId: IUser['_id'] } }) => {};
	};
	'channels.removeOwner': {
		POST: (params: { roomId: IRoom['_id']; userId: IUser['_id'] | { roomName: IRoom['name']; userId: IUser['_id'] } }) => {};
	};
	'channels.addLeader': {
		POST: (params: { roomId: IRoom['_id']; userId: IUser['_id'] | { roomName: IRoom['name']; userId: IUser['_id'] } }) => {};
	};
	'channels.removeLeader': {
		POST: (params: { roomId: IRoom['_id']; userId: IUser['_id'] | { roomName: IRoom['name']; userId: IUser['_id'] } }) => {};
	};
	'channels.roles': {
		GET: (params: { roomId: IRoom['_id'] } | { roomName: IRoom['name'] }) => { roles: IGetRoomRoles[] };
	};
	'channels.messages': {
		GET: (params: ChannelsMessagesProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'channels.open': {
		POST: (params: ChannelsOpenProps) => void;
	};
	'channels.setReadOnly': {
		POST: (params: { roomId: IRoom['_id']; readOnly: boolean } | { roomName: IRoom['name']; readOnly: boolean }) => {
			channel: IRoom;
		};
	};
	'channels.addAll': {
		POST: (params: ChannelsAddAllProps) => {
			channel: IRoom;
		};
	};
	'channels.anonymousread': {
		GET: (params: PaginatedRequest<{ roomId: IRoom['_id'] } | { roomName: string }>) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'channels.setAnnouncement': {
		POST: (params: ChannelsSetAnnouncementProps) => {};
	};
	'channels.getAllUserMentionsByChannel': {
		GET: (params: ChannelsGetAllUserMentionsByChannelProps) => PaginatedResult<{
			mentions: IUser[];
		}>;
	};
	'channels.moderators': {
		GET: (params: { roomId: IRoom['_id'] } | { roomName: string }) => { moderators: Pick<IUser, '_id' | 'name' | 'username'>[] };
	};
};
