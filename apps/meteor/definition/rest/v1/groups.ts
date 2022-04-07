import type { IMessage } from '../../IMessage';
import type { IRoom } from '../../IRoom';
import { ITeam } from '../../ITeam';
import type { IGetRoomRoles, IUser } from '../../IUser';

export type GroupsEndpoints = {
	'groups.files': {
		GET: (params: { roomId: IRoom['_id']; count: number; sort: string; query: string }) => {
			files: IMessage[];
			total: number;
		};
	};
	'groups.members': {
		GET: (params: { roomId: IRoom['_id']; offset?: number; count?: number; filter?: string; status?: string[] }) => {
			count: number;
			offset: number;
			members: IUser[];
			total: number;
		};
	};
	'groups.history': {
		GET: (params: { roomId: string; count: number; latest?: string }) => {
			messages: IMessage[];
		};
	};
	'groups.archive': {
		POST: (params: { roomId: string }) => void;
	};
	'groups.unarchive': {
		POST: (params: { roomId: string }) => void;
	};
	'groups.create': {
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
	'groups.convertToTeam': {
		POST: (params: { roomId: string; roomName: string }) => { team: ITeam };
	};
	'groups.counters': {
		GET: (params: { roomId: string }) => {
			joined: boolean;
			members: number;
			unreads: number;
			unreadsFrom: Date;
			msgs: number;
			latest: Date;
			userMentions: number;
		};
	};
	'groups.close': {
		POST: (params: { roomId: string }) => {};
	};
	'groups.kick': {
		POST: (params: { roomId: string; userId: string }) => {};
	};
	'groups.delete': {
		POST: (params: { roomId: string }) => {};
	};
	'groups.leave': {
		POST: (params: { roomId: string }) => {};
	};
	'groups.roles': {
		GET: (params: { roomId: string }) => { roles: IGetRoomRoles[] };
	};
	'groups.messages': {
		GET: (params: {
			roomId: IRoom['_id'];
			query: { 'mentions._id': { $in: string[] } } | { 'starred._id': { $in: string[] } } | { pinned: boolean };
			offset: number;
			sort: { ts: number };
		}) => {
			messages: IMessage[];
		};
	};
};
