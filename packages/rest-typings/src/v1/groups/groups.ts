import type {
	IMessage,
	IRoom,
	ITeam,
	IGetRoomRoles,
	IUser,
	IUploadWithUser,
	IIntegration,
	ISubscription,
	IUserWithRoleInfo,
} from '@rocket.chat/core-typings';

import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { GroupsAddAllProps } from './GroupsAddAllProps';
import type { GroupsAddLeaderProps } from './GroupsAddLeaderProps';
import type { GroupsAddModeratorProps } from './GroupsAddModeratorProps';
import type { GroupsAddOwnerProps } from './GroupsAddOwnerProps';
import type { GroupsArchiveProps } from './GroupsArchiveProps';
import type { GroupsCloseProps } from './GroupsCloseProps';
import type { GroupsConvertToTeamProps } from './GroupsConvertToTeamProps';
import type { GroupsCountersProps } from './GroupsCountersProps';
import type { GroupsCreateProps } from './GroupsCreateProps';
import type { GroupsDeleteProps } from './GroupsDeleteProps';
import type { GroupsFilesProps } from './GroupsFilesProps';
import type { GroupsGetIntegrationsProps } from './GroupsGetIntegrationsProps';
import type { GroupsHistoryProps } from './GroupsHistoryProps';
import type { GroupsInfoProps } from './GroupsInfoProps';
import type { GroupsInviteProps } from './GroupsInviteProps';
import type { GroupsKickProps } from './GroupsKickProps';
import type { GroupsLeaveProps } from './GroupsLeaveProps';
import type { GroupsListProps } from './GroupsListProps';
import type { GroupsMembersProps } from './GroupsMembersProps';
import type { GroupsMessageProps } from './GroupsMessageProps';
import type { GroupsModeratorsProps } from './GroupsModeratorsProps';
import type { GroupsOnlineProps } from './GroupsOnlineProps';
import type { GroupsOpenProps } from './GroupsOpenProps';
import type { GroupsRemoveLeaderProps } from './GroupsRemoveLeaderProps';
import type { GroupsRemoveModeratorProps } from './GroupsRemoveModeratorProps';
import type { GroupsRemoveOwnerProps } from './GroupsRemoveOwnerProps';
import type { GroupsRenameProps } from './GroupsRenameProps';
import type { GroupsRolesProps } from './GroupsRolesProps';
import type { GroupsSetAnnouncementProps } from './GroupsSetAnnouncementProps';
import type { GroupsSetCustomFieldsProps } from './GroupsSetCustomFieldsProps';
import type { GroupsSetDescriptionProps } from './GroupsSetDescriptionProps';
import type { GroupsSetEncryptedProps } from './GroupsSetEncryptedProps';
import type { GroupsSetPurposeProps } from './GroupsSetPurposeProps';
import type { GroupsSetReadOnlyProps } from './GroupsSetReadOnlyProps';
import type { GroupsSetTopicProps } from './GroupsSetTopicProps';
import type { GroupsSetTypeProps } from './GroupsSetTypeProps';
import type { GroupsUnarchiveProps } from './GroupsUnarchiveProps';

export type GroupsEndpoints = {
	'/v1/groups.files': {
		GET: (params: GroupsFilesProps) => PaginatedResult<{
			files: IUploadWithUser[];
		}>;
	};
	'/v1/groups.members': {
		GET: (params: GroupsMembersProps) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
	'/v1/groups.membersByHighestRole': {
		GET: (params: GroupsMembersProps) => {
			count: number;
			offset: number;
			members: IUserWithRoleInfo[];
			total: number;
		};
	};
	'/v1/groups.history': {
		GET: (params: GroupsHistoryProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/groups.archive': {
		POST: (params: GroupsArchiveProps) => void;
	};
	'/v1/groups.unarchive': {
		POST: (params: GroupsUnarchiveProps) => void;
	};
	'/v1/groups.create': {
		POST: (params: GroupsCreateProps) => {
			group: Omit<IRoom, 'joinCode' | 'members' | 'importIds' | 'e2e'>;
		};
	};
	'/v1/groups.convertToTeam': {
		POST: (params: GroupsConvertToTeamProps) => { team: ITeam };
	};
	'/v1/groups.counters': {
		GET: (params: GroupsCountersProps) => {
			joined: boolean;
			members: number | null;
			unreads: number | null;
			unreadsFrom: Date | null;
			msgs: number | null;
			latest: Date | null;
			userMentions: number | null;
		};
	};
	'/v1/groups.close': {
		POST: (params: GroupsCloseProps) => void;
	};
	'/v1/groups.kick': {
		POST: (params: GroupsKickProps) => void;
	};
	'/v1/groups.delete': {
		POST: (params: GroupsDeleteProps) => void;
	};
	'/v1/groups.leave': {
		POST: (params: GroupsLeaveProps) => void;
	};
	'/v1/groups.roles': {
		GET: (params: GroupsRolesProps) => { roles: IGetRoomRoles[] };
	};
	'/v1/groups.messages': {
		GET: (params: GroupsMessageProps) => PaginatedResult<{
			messages: IMessage[];
		}>;
	};
	'/v1/groups.addModerator': {
		POST: (params: GroupsAddModeratorProps) => void;
	};
	'/v1/groups.removeModerator': {
		POST: (params: GroupsRemoveModeratorProps) => void;
	};
	'/v1/groups.addOwner': {
		POST: (params: GroupsAddOwnerProps) => void;
	};
	'/v1/groups.removeOwner': {
		POST: (params: GroupsRemoveOwnerProps) => void;
	};
	'/v1/groups.addLeader': {
		POST: (params: GroupsAddLeaderProps) => void;
	};
	'/v1/groups.removeLeader': {
		POST: (params: GroupsRemoveLeaderProps) => void;
	};
	'/v1/groups.addAll': {
		POST: (params: GroupsAddAllProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.getIntegrations': {
		GET: (params: GroupsGetIntegrationsProps) => {
			count: number;
			offset: number;
			integrations: IIntegration[];
			total: number;
		};
	};
	'/v1/groups.info': {
		GET: (params: GroupsInfoProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.invite': {
		POST: (params: GroupsInviteProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.list': {
		GET: (params: GroupsListProps) => {
			count: number;
			offset: number;
			groups: IRoom[];
			total: number;
		};
	};
	'/v1/groups.listAll': {
		GET: (params: GroupsListProps) => {
			count: number;
			offset: number;
			groups: IRoom[];
			total: number;
		};
	};
	'/v1/groups.online': {
		GET: (params: GroupsOnlineProps) => {
			online: Pick<IUser, '_id' | 'username'>[];
		};
	};
	'/v1/groups.open': {
		POST: (params: GroupsOpenProps) => void;
	};
	'/v1/groups.rename': {
		POST: (params: GroupsRenameProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.setCustomFields': {
		POST: (params: GroupsSetCustomFieldsProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.setDescription': {
		POST: (params: GroupsSetDescriptionProps) => {
			description: string;
		};
	};
	'/v1/groups.setPurpose': {
		POST: (params: GroupsSetPurposeProps) => {
			purpose: string;
		};
	};
	'/v1/groups.setReadOnly': {
		POST: (params: GroupsSetReadOnlyProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.setTopic': {
		POST: (params: GroupsSetTopicProps) => {
			topic: string;
		};
	};
	'/v1/groups.setType': {
		POST: (params: GroupsSetTypeProps) => {
			group: IRoom;
		};
	};
	'/v1/groups.setAnnouncement': {
		POST: (params: GroupsSetAnnouncementProps) => {
			announcement: string;
		};
	};
	'/v1/groups.moderators': {
		GET: (params: GroupsModeratorsProps) => { moderators: ISubscription['u'][] };
	};
	'/v1/groups.setEncrypted': {
		POST: (params: GroupsSetEncryptedProps) => {
			group: IRoom;
		};
	};
};
