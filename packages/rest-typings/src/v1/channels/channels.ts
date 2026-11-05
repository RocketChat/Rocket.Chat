import type { IUploadWithUser, IMessage, IRoom, ITeam, IUser, IIntegration } from '@rocket.chat/core-typings';

import type { ChannelsAddAllProps } from './ChannelsAddAllProps.js';
import type { ChannelsArchiveProps } from './ChannelsArchiveProps.js';
import type { ChannelsConvertToTeamProps } from './ChannelsConvertToTeamProps.js';
import type { ChannelsCreateProps } from './ChannelsCreateProps.js';
import type { ChannelsDeleteProps } from './ChannelsDeleteProps.js';
import type { ChannelsFilesListProps } from './ChannelsFilesListProps.js';
import type { ChannelsGetAllUserMentionsByChannelProps } from './ChannelsGetAllUserMentionsByChannelProps.js';
import type { ChannelsGetIntegrationsProps } from './ChannelsGetIntegrationsProps.js';
import type { ChannelsHistoryProps } from './ChannelsHistoryProps.js';
import type { ChannelsInviteProps } from './ChannelsInviteProps.js';
import type { ChannelsJoinProps } from './ChannelsJoinProps.js';
import type { ChannelsKickProps } from './ChannelsKickProps.js';
import type { ChannelsLeaveProps } from './ChannelsLeaveProps.js';
import type { ChannelsListProps } from './ChannelsListProps.js';
import type { ChannelsMessagesProps } from './ChannelsMessagesProps.js';
import type { ChannelsModeratorsProps } from './ChannelsModeratorsProps.js';
import type { ChannelsOnlineProps } from './ChannelsOnlineProps.js';
import type { ChannelsOpenProps } from './ChannelsOpenProps.js';
import type { ChannelsRenameProps } from './ChannelsRenameProps.js';
import type { ChannelsRolesProps } from './ChannelsRolesProps.js';
import type { ChannelsSetAnnouncementProps } from './ChannelsSetAnnouncementProps.js';
import type { ChannelsSetCustomFieldsProps } from './ChannelsSetCustomFieldsProps.js';
import type { ChannelsSetDefaultProps } from './ChannelsSetDefaultProps.js';
import type { ChannelsSetDescriptionProps } from './ChannelsSetDescriptionProps.js';
import type { ChannelsSetJoinCodeProps } from './ChannelsSetJoinCodeProps.js';
import type { ChannelsSetPurposeProps } from './ChannelsSetPurposeProps.js';
import type { ChannelsSetReadOnlyProps } from './ChannelsSetReadOnlyProps.js';
import type { ChannelsSetTopicProps } from './ChannelsSetTopicProps.js';
import type { ChannelsSetTypeProps } from './ChannelsSetTypeProps.js';
import type { ChannelsUnarchiveProps } from './ChannelsUnarchiveProps.js';
import type { IGetRoomRoles } from '../../helpers/IGetRoomRoles.js';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import type { PaginatedResult } from '../../helpers/PaginatedResult.js';

export * from './ChannelsFilesListProps.js';
export * from './ChannelsListProps.js';
export * from './ChannelsOnlineProps.js';

export type ChannelsEndpoints = {
	'/v1/channels.files': {
		GET: (params: ChannelsFilesListProps) => PaginatedResult<{
			files: IUploadWithUser[];
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
		GET: (params: ChannelsHistoryProps) => {
			messages: IMessage[];
			firstUnread?: IMessage;
			unreadNotLoaded?: number;
		};
	};
	'/v1/channels.archive': {
		POST: (params: ChannelsArchiveProps) => void;
	};
	'/v1/channels.unarchive': {
		POST: (params: ChannelsUnarchiveProps) => void;
	};
	'/v1/channels.create': {
		POST: (params: ChannelsCreateProps) => {
			channel: Omit<IRoom, 'joinCode' | 'members' | 'importIds' | 'e2e'>;
		};
	};
	'/v1/channels.convertToTeam': {
		POST: (params: ChannelsConvertToTeamProps) => {
			team: ITeam;
		};
	};
	'/v1/channels.info': {
		GET: (params: { roomId: string } | { roomName: string }) => { channel: IRoom };
	};
	'/v1/channels.counters': {
		GET: (params: { roomId: string; userId: string } | { roomName: string; userId: string }) => {
			joined: boolean;
			members: number | null;
			unreads: number | null;
			unreadsFrom: Date | null;
			msgs: number | null;
			latest: Date | null;
			userMentions: number | null;
		};
	};
	'/v1/channels.join': {
		POST: (params: ChannelsJoinProps) => {
			channel: IRoom;
		};
	};
	'/v1/channels.close': {
		POST: (params: { roomId: string } | { roomName: string }) => void;
	};
	'/v1/channels.kick': {
		POST: (params: ChannelsKickProps) => {
			channel: IRoom;
		};
	};
	'/v1/channels.delete': {
		POST: (params: ChannelsDeleteProps) => void;
	};
	'/v1/channels.leave': {
		POST: (params: ChannelsLeaveProps) => {
			channel: IRoom;
		};
	};
	'/v1/channels.addModerator': {
		POST: (params: ChannelsModeratorsProps) => void;
	};
	'/v1/channels.removeModerator': {
		POST: (params: ChannelsModeratorsProps) => void;
	};
	'/v1/channels.addOwner': {
		POST: (params: ChannelsModeratorsProps) => void;
	};
	'/v1/channels.removeOwner': {
		POST: (params: ChannelsModeratorsProps) => void;
	};
	'/v1/channels.addLeader': {
		POST: (params: ChannelsModeratorsProps) => void;
	};
	'/v1/channels.removeLeader': {
		POST: (params: ChannelsModeratorsProps) => void;
	};
	'/v1/channels.roles': {
		GET: (params: ChannelsRolesProps) => { roles: IGetRoomRoles[] };
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
		POST: (params: ChannelsSetReadOnlyProps) => {
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
			mentions: IMessage[];
		}>;
	};
	'/v1/channels.moderators': {
		GET: (params: { roomId: string } | { roomName: string }) => { moderators: Pick<IUser, '_id' | 'name' | 'username'>[] };
	};
	'/v1/channels.getIntegrations': {
		GET: (params: ChannelsGetIntegrationsProps) => {
			count: number;
			offset: number;
			integrations: IIntegration[];
			total: number;
		};
	};
	'/v1/channels.invite': {
		POST: (params: ChannelsInviteProps) => {
			channel: IRoom;
		};
	};
	'/v1/channels.list': {
		GET: (params: ChannelsListProps) => {
			count: number;
			offset: number;
			channels: IRoom[];
			total: number;
		};
	};
	'/v1/channels.list.joined': {
		GET: (params: ChannelsListProps) => {
			count: number;
			offset: number;
			channels: IRoom[];
			total: number;
		};
	};
	'/v1/channels.online': {
		GET: (params: ChannelsOnlineProps) => {
			online: Pick<IUser, '_id' | 'username'>[];
		};
	};
	'/v1/channels.rename': {
		POST: (params: ChannelsRenameProps) => {
			channel: IRoom;
		};
	};
	'/v1/channels.setCustomFields': {
		POST: (params: ChannelsSetCustomFieldsProps) => {
			channel: IRoom;
		};
	};
	'/v1/channels.setDescription': {
		POST: (params: ChannelsSetDescriptionProps) => {
			description: string;
		};
	};
	'/v1/channels.setPurpose': {
		POST: (params: ChannelsSetPurposeProps) => {
			purpose: string;
		};
	};
	'/v1/channels.setTopic': {
		POST: (params: ChannelsSetTopicProps) => {
			topic: string;
		};
	};
	'/v1/channels.setType': {
		POST: (params: ChannelsSetTypeProps) => {
			channel: IRoom;
		};
	};
	'/v1/channels.setDefault': {
		POST: (params: ChannelsSetDefaultProps) => {
			channel: IRoom;
		};
	};
	'/v1/channels.setJoinCode': {
		POST: (params: ChannelsSetJoinCodeProps) => {
			channel: IRoom;
		};
	};
};
