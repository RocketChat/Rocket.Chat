import type { IUpload, IMessage, IRoom, ITeam, IGetRoomRoles, IUser } from '@rocket.chat/core-typings';

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
		GET: (params: PaginatedRequest<{ roomId: string } | { roomName: string }>) => PaginatedResult<{
			files: IUpload[];
		}>;
	};
	'channels.members': {
		GET: (
			params: PaginatedRequest<
				{ roomId: string; filter?: string; status?: string[] } | { roomName: string; filter?: string; status?: string[] }
			>,
		) => PaginatedResult<{
			members: IUser[];
		}>;
	};
	'/v1/channels.history': {
		GET: (
			params: PaginatedRequest<
				| {
						roomId: string;
						latest?: string;
						showThreadMessages?: 'false' | 'true';
						oldest?: string;
						inclusive?: 'false' | 'true';
				  }
				| {
						roomName: string;
						latest?: string;
						showThreadMessages?: 'false' | 'true';
						oldest?: string;
						inclusive?: 'false' | 'true';
				  }
			>,
		) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/channels.archive': {
		POST: (params: ChannelsArchiveProps) => void;
	};
	'/v1/channels.unarchive': {
		POST: (params: ChannelsUnarchiveProps) => void;
	};
	'/v1/channels.create': {
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
	'/v1/channels.convertToTeam': {
		POST: (params: { channelId: string; channelName: string }) => {
			team: ITeam;
		};
	};
	'channels.info': {
		GET: (params: { roomId: string } | { roomName: string }) => { channel: IRoom };
	};
	'channels.counters': {
		GET: (params: { roomId: string } | { roomName: string }) => {
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
		POST: (params: { roomId: string; joinCode?: string } | { roomName: string; joinCode?: string }) => {
			channel: IRoom;
		};
	};
	'channels.close': {
		POST: (params: { roomId: string } | { roomName: string }) => {};
	};
	'channels.kick': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {};
	};
	'/v1/channels.delete': {
		POST: (params: ChannelsDeleteProps) => void;
	};
	'channels.leave': {
		POST: (params: { roomId: string } | { roomName: string }) => {};
	};
	'channels.addModerator': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {};
	};
	'channels.removeModerator': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {};
	};
	'channels.addOwner': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {};
	};
	'channels.removeOwner': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {};
	};
	'channels.addLeader': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {};
	};
	'channels.removeLeader': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {};
	};
	'channels.roles': {
		GET: (params: { roomId: string } | { roomName: string }) => { roles: IGetRoomRoles[] };
	};
	'/v1/channels.messages': {
		GET: (params: ChannelsMessagesProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/channels.open': {
		POST: (params: ChannelsOpenProps) => void;
	};
	'channels.setReadOnly': {
		POST: (params: { roomId: string; readOnly: boolean } | { roomName: string; readOnly: boolean }) => {
			channel: IRoom;
		};
	};
	'/v1/channels.addAll': {
		POST: (params: ChannelsAddAllProps) => {
			channel: IRoom;
		};
	};
	'/v1/channels.anonymousread': {
		GET: (params: PaginatedRequest<{ roomId: string } | { roomName: string }>) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/channels.setAnnouncement': {
		POST: (params: ChannelsSetAnnouncementProps) => {};
	};
	'/v1/channels.getAllUserMentionsByChannel': {
		GET: (params: ChannelsGetAllUserMentionsByChannelProps) => PaginatedResult<{
			mentions: IUser[];
		}>;
	};
	'channels.moderators': {
		GET: (params: { roomId: string } | { roomName: string }) => { moderators: Pick<IUser, '_id' | 'name' | 'username'>[] };
	};
};
