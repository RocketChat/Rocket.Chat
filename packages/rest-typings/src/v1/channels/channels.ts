import type { IUpload, IMessage, IRoom, ITeam, IGetRoomRoles, IUser } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { ChannelsAddAllProps } from './ChannelsAddAllProps';
import type { ChannelsArchiveProps } from './ChannelsArchiveProps';
import type { ChannelsDeleteProps } from './ChannelsDeleteProps';
import type { ChannelsGetAllUserMentionsByChannelProps } from './ChannelsGetAllUserMentionsByChannelProps';
import type { ChannelsHistoryProps } from './ChannelsHistoryProps';
import type { ChannelsMessagesProps } from './ChannelsMessagesProps';
import type { ChannelsOpenProps } from './ChannelsOpenProps';
import type { ChannelsSetAnnouncementProps } from './ChannelsSetAnnouncementProps';
import type { ChannelsUnarchiveProps } from './ChannelsUnarchiveProps';

export type ChannelsEndpoints = {
	'/v1/channels.files': {
		GET: (params: PaginatedRequest<{ roomId: string } | { roomName: string }>) => PaginatedResult<{
			files: IUpload[];
		}>;
	};
	'/v1/channels.members': {
		GET: (
			params: PaginatedRequest<
				{ roomId: string; filter?: string; status?: string[] } | { roomName: string; filter?: string; status?: string[] }
			>,
		) => PaginatedResult<{
			members: IUser[];
		}>;
	};
	'/v1/channels.history': {
		GET: (params: ChannelsHistoryProps) => PaginatedResult<{
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
			channel: Omit<IRoom, 'joinCode' | 'members' | 'importIds' | 'e2e'>;
		};
	};
	'/v1/channels.convertToTeam': {
		POST: (params: { channelId: string; channelName: string }) => {
			team: ITeam;
		};
	};
	'/v1/channels.info': {
		GET: (params: { roomId: string } | { roomName: string }) => { channel: IRoom };
	};
	'/v1/channels.counters': {
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
	'/v1/channels.join': {
		POST: (params: { roomId: string; joinCode?: string } | { roomName: string; joinCode?: string }) => {
			channel: IRoom;
		};
	};
	'/v1/channels.close': {
		POST: (params: { roomId: string } | { roomName: string }) => void;
	};
	'/v1/channels.kick': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {
			channel: IRoom;
		};
	};
	'/v1/channels.delete': {
		POST: (params: ChannelsDeleteProps) => void;
	};
	'/v1/channels.leave': {
		POST: (params: { roomId: string } | { roomName: string }) => {
			channel: IRoom;
		};
	};
	'/v1/channels.addModerator': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => void;
	};
	'/v1/channels.removeModerator': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => void;
	};
	'/v1/channels.addOwner': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => void;
	};
	'/v1/channels.removeOwner': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => void;
	};
	'/v1/channels.addLeader': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => void;
	};
	'/v1/channels.removeLeader': {
		POST: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => void;
	};
	'/v1/channels.roles': {
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
	'/v1/channels.setReadOnly': {
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
		POST: (params: ChannelsSetAnnouncementProps) => {
			announcement: string;
		};
	};
	'/v1/channels.getAllUserMentionsByChannel': {
		GET: (params: ChannelsGetAllUserMentionsByChannelProps) => PaginatedResult<{
			mentions: IUser[];
		}>;
	};
	'/v1/channels.moderators': {
		GET: (params: { roomId: string } | { roomName: string }) => { moderators: Pick<IUser, '_id' | 'name' | 'username'>[] };
	};
};
