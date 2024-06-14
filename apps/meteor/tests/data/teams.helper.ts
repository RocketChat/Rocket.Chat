import { IRoom, ITeam, TEAM_TYPE } from '@rocket.chat/core-typings';
import { api, request } from './api-data';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export const createTeam = async (credentials: Record<string, any>, teamName: string, type: TEAM_TYPE): Promise<ITeam> => {
	const response = await request.post(api('teams.create')).set(credentials).send({
		name: teamName,
		type,
	});

	return response.body.team;
};

export const deleteTeam = async (credentials: Record<string, any>, teamName: string): Promise<void> => {
	await request.post(api('teams.delete')).set(credentials).send({
		teamName,
	});
};

export const addMembers = async (credentials: Record<string, any>, teamName: string, members: IUser['id'][]): Promise<void> => {
	await request
		.post(api('teams.addMembers'))
		.set(credentials)
		.send({
			teamName: teamName,
			members: members.map((userId) => ({ userId, roles: ['member'] })),
		});
};

export const addRoom = async (
	credentials: Record<string, any>,
	teamName: string,
	roomId: IRoom['_id'] | Array<IRoom['_id']>,
): Promise<void> => {
	const rooms = Array.isArray(roomId) ? roomId : [roomId];
	await request.post(api('teams.addRooms')).set(credentials).send({
		teamName,
		rooms,
	});
};
