import type { IMessage, IRoom, ITeam, IGetRoomRoles, IUser, IUpload } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { GroupsArchiveProps } from './GroupsArchiveProps';
import type { GroupsMembersProps } from './GroupsMembersProps';
import type { GroupsFilesProps } from './GroupsFilesProps';
import type { GroupsUnarchiveProps } from './GroupsUnarchiveProps';
import type { GroupsCreateProps } from './GroupsCreateProps';
import type { GroupsConvertToTeamProps } from './GroupsConvertToTeamProps';
import type { GroupsCountersProps } from './GroupsCountersProps';
import type { GroupsDeleteProps } from './GroupsDeleteProps';
import type { GroupsCloseProps } from './GroupsCloseProps';
import type { GroupsKickProps } from './GroupsKickProps';
import type { GroupsLeaveProps } from './GroupsLeaveProps';
import type { GroupsRolesProps } from './GroupsRolesProps';
import type { GroupsMessageProps } from './GroupsMessageProps';

export type GroupsEndpoints = {
	'/v1/groups.files': {
		GET: (params: GroupsFilesProps) => PaginatedResult<{
			files: IUpload[];
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
		GET: (params: PaginatedRequest<{ roomId: string; latest?: string }>) => PaginatedResult<{
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
			members: number;
			unreads: number;
			unreadsFrom: Date;
			msgs: number;
			latest: Date;
			userMentions: number;
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
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.removeModerator': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.addOwner': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.removeOwner': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.addLeader': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
	'/v1/groups.removeLeader': {
		POST: (params: { roomId: string; userId: string }) => void;
	};
};
