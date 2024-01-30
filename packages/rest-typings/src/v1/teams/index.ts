import type { IRole, IRoom, ITeam } from '@rocket.chat/core-typings';

import type { PaginatedResult } from '../../helpers/PaginatedResult';
import type { TeamsAddMembersProps } from './TeamsAddMembersProps';
import type { TeamsAddRoomsProps } from './TeamsAddRoomsProps';
import type { TeamsConvertToChannelProps } from './TeamsConvertToChannelProps';
import type { TeamsCreateProps } from './TeamsCreateProps';
import type { TeamsDeleteProps } from './TeamsDeleteProps';
import type { TeamsInfoProps } from './TeamsInfoProps';
import type { TeamsLeaveProps } from './TeamsLeaveProps';
import type { TeamsListRoomsOfUserProps } from './TeamsListRoomsOfUserProps';
import type { TeamsListRoomsProps } from './TeamsListRoomsProps';
import type { TeamsMembersProps } from './TeamsMembersProps';
import type { TeamsRemoveMemberProps } from './TeamsRemoveMemberProps';
import type { TeamsRemoveRoomProps } from './TeamsRemoveRoomProps';
import type { TeamsUpdateMemberProps } from './TeamsUpdateMemberProps';
import type { TeamsUpdateProps } from './TeamsUpdateProps';
import type { TeamsUpdateRoomProps } from './TeamsUpdateRoomProps';

export * from './TeamsAddMembersProps';
export * from './TeamsConvertToChannelProps';
export * from './TeamsDeleteProps';
export * from './TeamsLeaveProps';
export * from './TeamsRemoveMemberProps';
export * from './TeamsRemoveRoomProps';
export * from './TeamsUpdateMemberProps';
export * from './TeamsUpdateProps';
export * from './TeamsCreateProps';
export * from './TeamsAddRoomsProps';
export * from './TeamsUpdateRoomProps';
export * from './TeamsListRoomsProps';
export * from './TeamsListRoomsOfUserProps';
export * from './TeamsMembersProps';
export * from './TeamsInfoProps';

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
	| TeamsUpdateProps
	| TeamsCreateProps
	| TeamsAddRoomsProps
	| TeamsUpdateRoomProps
	| TeamsListRoomsProps
	| TeamsListRoomsOfUserProps
	| TeamsMembersProps
	| TeamsInfoProps;

export const isTeamPropsWithTeamName = <T extends TeamProps>(props: T): props is T & { teamName: string } => 'teamName' in props;

export const isTeamPropsWithTeamId = <T extends TeamProps>(props: T): props is T & { teamId: string } => 'teamId' in props;

export type TeamsEndpoints = {
	'/v1/teams.list': {
		GET: () => PaginatedResult & { teams: ITeam[] };
	};
	'/v1/teams.listAll': {
		GET: () => { teams: ITeam[] } & PaginatedResult;
	};
	'/v1/teams.create': {
		POST: (params: TeamsCreateProps) => {
			team: ITeam;
		};
	};

	'/v1/teams.convertToChannel': {
		POST: (params: TeamsConvertToChannelProps) => void;
	};

	'/v1/teams.addRooms': {
		POST: (params: TeamsAddRoomsProps) => { rooms: IRoom[] };
	};

	'/v1/teams.removeRoom': {
		POST: (params: TeamsRemoveRoomProps) => { room: IRoom };
	};

	'/v1/teams.members': {
		GET: (params: TeamsMembersProps) => PaginatedResult & { members: ITeamMemberInfo[] };
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
		GET: (params: TeamsInfoProps) => { teamInfo: Partial<ITeam> };
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
		GET: (params: TeamsListRoomsOfUserProps) => PaginatedResult & { rooms: IRoom[] };
	};

	'/v1/teams.listRooms': {
		GET: (params: TeamsListRoomsProps) => PaginatedResult & { rooms: IRoom[] };
	};

	'/v1/teams.updateRoom': {
		POST: (params: TeamsUpdateRoomProps) => {
			room: IRoom;
		};
	};
};
