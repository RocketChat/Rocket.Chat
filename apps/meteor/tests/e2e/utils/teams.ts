import { faker } from '@faker-js/faker';
import type { GroupsCreateProps } from '@rocket.chat/rest-typings';

import type { BaseTest } from './test';

export async function createTargetTeam(api: BaseTest['api'], options?: Omit<GroupsCreateProps, 'name'>): Promise<string> {
	const name = faker.string.uuid();
	await api.post('/teams.create', { name, type: 1, members: ['user2', 'user1'], ...options });

	return name;
}

export async function createChannelWithTeam(api: BaseTest['api']): Promise<Record<string, string>> {
	const channelName = faker.string.uuid();
	const teamName = faker.string.uuid();

	const teamResponse = await api.post('/teams.create', { name: teamName, type: 1, members: ['user2'] });
	const { team } = await teamResponse.json();

	await api.post('/channels.create', { name: channelName, members: ['user1'], extraData: { teamId: team._id } });

	return { channelName, teamName };
}
