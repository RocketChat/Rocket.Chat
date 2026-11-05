import type { IMessage, IRoom, ITeam, IUser, IUploadWithUser, IIntegration, ISubscription } from '@rocket.chat/core-typings';

import type { GroupsAddAllProps } from './GroupsAddAllProps.js';
import type { GroupsAddLeaderProps } from './GroupsAddLeaderProps.js';
import type { GroupsAddModeratorProps } from './GroupsAddModeratorProps.js';
import type { GroupsAddOwnerProps } from './GroupsAddOwnerProps.js';
import type { GroupsArchiveProps } from './GroupsArchiveProps.js';
import type { GroupsCloseProps } from './GroupsCloseProps.js';
import type { GroupsConvertToTeamProps } from './GroupsConvertToTeamProps.js';
import type { GroupsCountersProps } from './GroupsCountersProps.js';
import type { GroupsCreateProps } from './GroupsCreateProps.js';
import type { GroupsDeleteProps } from './GroupsDeleteProps.js';
import type { GroupsFilesProps } from './GroupsFilesProps.js';
import type { GroupsGetIntegrationsProps } from './GroupsGetIntegrationsProps.js';
import type { GroupsHistoryProps } from './GroupsHistoryProps.js';
import type { GroupsInfoProps } from './GroupsInfoProps.js';
import type { GroupsInviteProps } from './GroupsInviteProps.js';
import type { GroupsKickProps } from './GroupsKickProps.js';
import type { GroupsLeaveProps } from './GroupsLeaveProps.js';
import type { GroupsListProps } from './GroupsListProps.js';
import type { GroupsMembersProps } from './GroupsMembersProps.js';
import type { GroupsMessagesProps } from './GroupsMessagesProps.js';
import type { GroupsModeratorsProps } from './GroupsModeratorsProps.js';
import type { GroupsOnlineProps } from './GroupsOnlineProps.js';
import type { GroupsOpenProps } from './GroupsOpenProps.js';
import type { GroupsRemoveLeaderProps } from './GroupsRemoveLeaderProps.js';
import type { GroupsRemoveModeratorProps } from './GroupsRemoveModeratorProps.js';
import type { GroupsRemoveOwnerProps } from './GroupsRemoveOwnerProps.js';
import type { GroupsRenameProps } from './GroupsRenameProps.js';
import type { GroupsRolesProps } from './GroupsRolesProps.js';
import type { GroupsSetAnnouncementProps } from './GroupsSetAnnouncementProps.js';
import type { GroupsSetCustomFieldsProps } from './GroupsSetCustomFieldsProps.js';
import type { GroupsSetDescriptionProps } from './GroupsSetDescriptionProps.js';
import type { GroupsSetEncryptedProps } from './GroupsSetEncryptedProps.js';
import type { GroupsSetPurposeProps } from './GroupsSetPurposeProps.js';
import type { GroupsSetReadOnlyProps } from './GroupsSetReadOnlyProps.js';
import type { GroupsSetTopicProps } from './GroupsSetTopicProps.js';
import type { GroupsSetTypeProps } from './GroupsSetTypeProps.js';
import type { GroupsUnarchiveProps } from './GroupsUnarchiveProps.js';
import type { IGetRoomRoles } from '../../helpers/IGetRoomRoles.js';
import type { PaginatedResult } from '../../helpers/PaginatedResult.js';

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
			skippedMembers?: string[];
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
		GET: (params: GroupsMessagesProps) => PaginatedResult<{
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
