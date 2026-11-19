import type { IRole, IRoom, ITeam, IUser } from '@rocket.chat/core-typings';

import type { TeamsAddMembersProps } from './TeamsAddMembersProps.js';
import type { TeamsConvertToChannelProps } from './TeamsConvertToChannelProps.js';
import type { TeamsCreateProps } from './TeamsCreateProps.js';
import type { TeamsDeleteProps } from './TeamsDeleteProps.js';
import type { TeamsInfoProps } from './TeamsInfoProps.js';
import type { TeamsLeaveProps } from './TeamsLeaveProps.js';
import type { TeamsListChildrenProps } from './TeamsListChildren.js';
import type { TeamsRemoveMemberProps } from './TeamsRemoveMemberProps.js';
import type { TeamsRemoveRoomProps } from './TeamsRemoveRoomProps.js';
import type { TeamsUpdateMemberProps } from './TeamsUpdateMemberProps.js';
import type { TeamsUpdateProps } from './TeamsUpdateProps.js';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import type { PaginatedResult } from '../../helpers/PaginatedResult.js';

export * from './TeamsAddMembersProps.js';
export * from './TeamsAddRoomsProps.js';
export * from './TeamsAutocompleteProps.js';
export * from './TeamsConvertToChannelProps.js';
export * from './TeamsCreateProps.js';
export * from './TeamsDeleteProps.js';
export * from './TeamsInfoProps.js';
export * from './TeamsLeaveProps.js';
export * from './TeamsListChildren.js';
export * from './TeamsListRoomsOfUserProps.js';
export * from './TeamsListRoomsProps.js';
export * from './TeamsMembersProps.js';
export * from './TeamsRemoveMemberProps.js';
export * from './TeamsRemoveRoomProps.js';
export * from './TeamsUpdateMemberProps.js';
export * from './TeamsUpdateProps.js';
export * from './TeamsUpdateRoomProps.js';

type ITeamAutocompleteResult = Pick<IRoom, '_id' | 'fname' | 'teamId' | 'name' | 't' | 'avatarETag'>;

interface IUserInfo {
	_id: string;
	username?: string;
	name?: string;
	status?: string;
	settings?: Record<string, any>;
}
interface ITeamMemberInfo {
	user: IUserInfo;
	roles?: IRole['_id'][] | null;
	createdBy: Omit<IUserInfo, 'name' | 'status'>;
	createdAt: Date;
}

type TeamProps =
	| TeamsRemoveRoomProps
	| TeamsConvertToChannelProps
	| TeamsUpdateMemberProps
	| TeamsAddMembersProps
	| TeamsRemoveMemberProps
	| TeamsDeleteProps
	| TeamsLeaveProps
	| TeamsUpdateProps;

export const isTeamPropsWithTeamName = <T extends TeamProps>(props: T): props is T & { teamName: string } => 'teamName' in props;

export const isTeamPropsWithTeamId = <T extends TeamProps>(props: T): props is T & { teamId: string } => 'teamId' in props;

// Public mirror of the implementation routes (apps/meteor/server/api/v1/teams.ts).
// teams.list/listAll/create are chained into `teamsEndpoints`, so they are part of the impl's
// `ExtractRoutesFromAPI<...>` and MUST stay byte-identical to the impl generics, or the two
// `interface Endpoints extends TeamsEndpoints` declarations collide (TS2320). The remaining routes
// are registered as standalone `API.v1` calls, are not in the impl-derived type, and so carry the
// rich SDK types their consumers expect (kept in sync with the impl's response schema generics).
export type TeamsEndpoints = {
	'/v1/teams.list': {
		GET: (params?: never) => { teams: ITeam[]; total: number; count: number; offset: number };
	};
	'/v1/teams.listAll': {
		GET: (params?: never) => { teams: ITeam[]; total: number; count: number; offset: number };
	};
	'/v1/teams.create': {
		POST: (params: TeamsCreateProps) => { team: ITeam; skippedMembers?: string[] };
	};

	'/v1/teams.convertToChannel': {
		POST: (params: TeamsConvertToChannelProps) => void;
	};

	'/v1/teams.addRooms': {
		POST: (params: { rooms: IRoom['_id'][]; teamId: string } | { rooms: IRoom['_id'][]; teamName: string }) => { rooms: IRoom[] };
	};

	'/v1/teams.removeRoom': {
		POST: (params: TeamsRemoveRoomProps) => { room: IRoom };
	};

	'/v1/teams.members': {
		GET: (
			params: ({ teamId: string } | { teamName: string }) & {
				status?: string[];
				username?: string;
				name?: string;
			},
		) => PaginatedResult & { members: ITeamMemberInfo[] };
	};

	'/v1/teams.addMembers': {
		POST: (params: TeamsAddMembersProps) => void;
	};

	'/v1/teams.updateMember': {
		POST: (params: TeamsUpdateMemberProps) => void;
	};

	'/v1/teams.removeMember': {
		POST: (params: TeamsRemoveMemberProps) => void;
	};

	'/v1/teams.leave': {
		POST: (params: TeamsLeaveProps) => void;
	};

	'/v1/teams.info': {
		GET: (params: TeamsInfoProps) => {
			teamInfo: ITeam;
		};
	};

	'/v1/teams.autocomplete': {
		GET: (params: { name: string }) => { teams: ITeamAutocompleteResult[] };
	};

	'/v1/teams.update': {
		POST: (params: TeamsUpdateProps) => void;
	};

	'/v1/teams.delete': {
		POST: (params: TeamsDeleteProps) => void;
	};

	'/v1/teams.listRoomsOfUser': {
		GET: (
			params: PaginatedRequest<
				| {
						teamId: ITeam['_id'];
						userId: IUser['_id'];
						canUserDelete?: string;
				  }
				| {
						teamName: ITeam['name'];
						userId: IUser['_id'];
						canUserDelete?: string;
				  }
			>,
		) => PaginatedResult & { rooms: IRoom[] };
	};

	'/v1/teams.listRooms': {
		GET: (
			params: PaginatedRequest<
				({ teamId: string } | { teamName: string }) & {
					filter?: string;
					type?: string;
				}
			>,
		) => PaginatedResult & { rooms: IRoom[] };
	};

	'/v1/teams.updateRoom': {
		POST: (params: { roomId: IRoom['_id']; isDefault: boolean }) => {
			room: IRoom;
		};
	};

	'/v1/teams.listChildren': {
		GET: (params: TeamsListChildrenProps) => PaginatedResult<{ data: IRoom[] }>;
	};
};
