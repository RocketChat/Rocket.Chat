import type { IUpload, IUploadWithUser, IMessage, IRoom, ITeam, IGetRoomRoles, IUser, IIntegration } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { ChannelsAddAllProps } from './ChannelsAddAllProps';
import type { ChannelsArchiveProps } from './ChannelsArchiveProps';
import type { ChannelsConvertToTeamProps } from './ChannelsConvertToTeamProps';
import type { ChannelsCreateProps } from './ChannelsCreateProps';
import type { ChannelsDeleteProps } from './ChannelsDeleteProps';
import type { ChannelsGetAllUserMentionsByChannelProps } from './ChannelsGetAllUserMentionsByChannelProps';
import type { ChannelsGetIntegrationsProps } from './ChannelsGetIntegrationsProps';
import type { ChannelsHistoryProps } from './ChannelsHistoryProps';
import type { ChannelsImagesProps } from './ChannelsImagesProps';
import type { ChannelsInviteProps } from './ChannelsInviteProps';
import type { ChannelsJoinProps } from './ChannelsJoinProps';
import type { ChannelsKickProps } from './ChannelsKickProps';
import type { ChannelsLeaveProps } from './ChannelsLeaveProps';
import type { ChannelsListProps } from './ChannelsListProps';
import type { ChannelsMembersByHighestRoleProps } from './ChannelsMembersByHighestRoleProps';
import type { ChannelsMessagesProps } from './ChannelsMessagesProps';
import type { ChannelsModeratorsProps } from './ChannelsModeratorsProps';
import type { ChannelsOnlineProps } from './ChannelsOnlineProps';
import type { ChannelsOpenProps } from './ChannelsOpenProps';
import type { ChannelsRenameProps } from './ChannelsRenameProps';
import type { ChannelsRolesProps } from './ChannelsRolesProps';
import type { ChannelsSetAnnouncementProps } from './ChannelsSetAnnouncementProps';
import type { ChannelsSetCustomFieldsProps } from './ChannelsSetCustomFieldsProps';
import type { ChannelsSetDefaultProps } from './ChannelsSetDefaultProps';
import type { ChannelsSetDescriptionProps } from './ChannelsSetDescriptionProps';
import type { ChannelsSetJoinCodeProps } from './ChannelsSetJoinCodeProps';
import type { ChannelsSetPurposeProps } from './ChannelsSetPurposeProps';
import type { ChannelsSetReadOnlyProps } from './ChannelsSetReadOnlyProps';
import type { ChannelsSetTopicProps } from './ChannelsSetTopicProps';
import type { ChannelsSetTypeProps } from './ChannelsSetTypeProps';
import type { ChannelsUnarchiveProps } from './ChannelsUnarchiveProps';

export type ChannelsEndpoints = {
	'/v1/channels.files': {
		GET: (params: PaginatedRequest<{ roomId: string } | { roomName: string }>) => PaginatedResult<{
			files: IUploadWithUser[];
		}>;
	};
	'/v1/channels.images': {
		GET: (params: ChannelsImagesProps) => PaginatedResult<{
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
	'/v1/channels.membersByHighestRole': {
		GET: (params: ChannelsMembersByHighestRoleProps) => PaginatedResult<{
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
			mentions: IUser[];
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
