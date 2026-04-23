import type { BaseTest } from './test';

export async function createDirectMessage(api: BaseTest['api']): Promise<void> {
	await api.post('/dm.create', {
		usernames: 'user1,user2',
	});
}

export async function createDirectMessageRoom(api: BaseTest['api'], username: string): Promise<string> {
	const response = await api.post('/im.create', { username });
	const data: { success?: boolean; room?: { _id: string } } = await response.json();

	if (!data.room?._id) {
		throw new Error(`Error creating direct message room: ${JSON.stringify(data)}`);
	}

	return data.room._id;
}
