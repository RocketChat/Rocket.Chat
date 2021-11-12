import type { IRoom } from '../../IRoom';
import type { ITeam, TEAM_TYPE } from '../../ITeam';
import type { IUser } from '../../IUser';
import { PaginatedResult } from '../helpers/PaginatedResult';
import { PaginatedRequest } from '../helpers/PaginatedRequest';
import { ITeamAutocompleteResult, ITeamMemberInfo, ITeamMemberParams } from '../../../server/sdk/types/ITeamService';

type TeamsConvertToTeamsProps = {
	teamId?: string;
	teamName?: string;
	roomsToRemove?: string[];
}

type TeamsRemoveRoomsProps = { teamId: string; teamName: string; userId: IUser['_id']; rooms?: IRoom['_id'][] };

export const isTeamRemoveRoomsProps = (props: any): props is TeamsRemoveRoomsProps => props.teamId && props.teamName && props.userId;

type TeamsUpdateMemberProps = { teamId: string; teamName: string; member: ITeamMemberParams }

export const isTeamsUpdateMemberProps = (props: any): props is TeamsUpdateMemberProps => props.teamId && props.teamName && props.member && props.member.userId && props.member.roles;

type TeamsAddMembersProps = { teamId: string; teamName: string; members: ITeamMemberParams[] }

export const isTeamsAddMembersProps = (props: any): props is TeamsAddMembersProps => props.teamId && props.teamName && Array.isArray(props.members) && props.members.length && props.members.every((member: any) => 'userId' in member && 'roles' in member);

export type TeamsEndpoints = {
	'teams.list': {
		GET: () => PaginatedResult & { teams: ITeam[] };
	};
	'teams.listAll': {
		GET: () => { teams: ITeam[] } & PaginatedResult;
	};
	'teams.create': {
		POST: (params: {
			name: ITeam['name'];
			type?: ITeam['type'];
			members?: IUser['_id'][];
			room: {
				id?: string;
				name?: IRoom['name'];
				members?: IUser['_id'][];
				readOnly?: boolean;
				extraData?: {
					teamId?: string;
					teamMain?: boolean;
				} & { [key: string]: string | boolean };
				options?: {
					nameValidationRegex?: string;
					creator: string;
					subscriptionExtra?: {
						open: boolean;
						ls: Date;
						prid: IRoom['_id'];
					};
				} & {
					[key: string]:
					| string
					| {
						open: boolean;
						ls: Date;
						prid: IRoom['_id'];
					};
				};
			};
			owner?: IUser['_id'];
		}) => {
			team: ITeam;
		};
	};

	'teams.convertToChannel': {
		POST: (params: TeamsConvertToTeamsProps) => void;
	};

	'teams.addRooms': {
		POST: (params: { rooms: IRoom['_id'][]; teamId: string } | { rooms: IRoom['_id'][]; teamName: string }) => ({ rooms: IRoom[] });
	};

	'teams.removeRoom': {
		POST: (params: { roomId: IRoom['_id']; teamId: string; teamName: string }) => ({ room: IRoom });
	};

	'teams.members': {
		GET: (params: { teamId: string; teamName: string; status?: string[]; username?: string; name?: string }) => (PaginatedResult & { members: ITeamMemberInfo[] });
	};

	'teams.addMembers': {
		POST: (params: { teamId: string; teamName: string; members: ITeamMemberParams[] }) => void;
	};

	'teams.updateMember': {
		POST: (params: TeamsUpdateMemberProps) => void;
	};

	'teams.removeMember': {
		POST: (params: { teamId: string; teamName: string; userId: IUser['_id']; rooms?: IRoom['_id'][] }) => void;
	};

	'teams.leave': {
		POST: (params: { teamId: string; teamName: string; rooms?: IRoom['_id'][] }) => void;
	};


	'teams.info': {
		GET: (params: { teamId: string; teamName: string }) => ({ teamInfo: Partial<ITeam> });
	};

	'teams.autocomplete': {
		GET: (params: { name: string }) => ({ teams: ITeamAutocompleteResult[] });
	};

	'teams.update': {
		POST: (params: { teamId: string; data: { name?: string; type?: TEAM_TYPE } }) => void;
	};

	'teams.delete': {
		POST: (params: { teamId: string; teamName: string; roomsToRemove?: string[] }) => void;
	};

	'teams.listRoomsOfUser': {
		GET: (params: {
			teamId: ITeam['_id'];
			userId: IUser['_id'];
			canUserDelete?: boolean;
		} | {
			teamName: ITeam['name'];
			userId: IUser['_id'];
			canUserDelete?: boolean;
		}
		) => PaginatedResult & { rooms: IRoom[] };
	};

	'teams.listRooms': {
		GET: (params: PaginatedRequest & ({ teamId: string;} | { teamId: string }) & { filter?: string; type?: string }) => PaginatedResult & { rooms: IRoom[] };
	};


	'teams.updateRoom': {
		POST: (params: { roomId: IRoom['_id']; isDefault: boolean }) => ({ room: IRoom });
	};
};
