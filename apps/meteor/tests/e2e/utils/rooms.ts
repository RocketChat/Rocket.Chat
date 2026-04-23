import type { IRoom, IUser } from '@rocket.chat/core-typings';

import type { BaseTest } from './test';

export async function deleteChannel(api: BaseTest['api'], roomName: string): Promise<void> {
	await api.post('/channels.delete', { roomName });
}

export async function deleteRoom(api: BaseTest['api'], roomId: string): Promise<void> {
	await api.post('/rooms.delete', { roomId });
}

export async function deleteTeam(api: BaseTest['api'], teamName: string): Promise<void> {
	await api.post('/teams.delete', { teamName });
}

export async function inviteUsersToRoom(api: BaseTest['api'], roomId: string, usernames: string[]): Promise<void> {
	const infoResponse = await api.get(`/rooms.info?roomId=${roomId}`);
	const { room }: { room: IRoom } = await infoResponse.json();

	const inviteEndpoint = room.t === 'p' ? '/groups.invite' : '/channels.invite';

	const userIds = await Promise.all(
		usernames.map(async (username) => {
			const response = await api.get(`/users.info?username=${username}`);
			const { user }: { user: Pick<IUser, '_id'> } = await response.json();

			if (!user?._id) {
				throw new Error(`Could not resolve username '${username}' to userId`);
			}

			return user._id;
		}),
	);

	await Promise.all(userIds.map((userId) => api.post(inviteEndpoint, { roomId, userId })));
}

export async function setRoomTopic(api: BaseTest['api'], roomId: string, topic: string): Promise<void> {
	await api.post('/rooms.saveRoomSettings', { rid: roomId, roomTopic: topic });
}
