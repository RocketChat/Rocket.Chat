import faker from '@faker-js/faker';

import type { BaseTest } from './test';

/**
 * createTargetChannel:
 *  - Usefull to create a target channel for message related tests
 */
export async function createTargetChannel(api: BaseTest['api']): Promise<string> {
	const name = faker.datatype.uuid();

	await api.post('/channels.create', { name });

	return name;
}

export async function createTargetTeam(api: BaseTest['api']): Promise<string> {
	const name = faker.datatype.uuid();

	await api.post('/teams.create', { name, type: 1, members: ['user2', 'user1'] });

	return name;
}

export async function createDirectMessage(api: BaseTest['api']): Promise<void> {
	await api.post('/dm.create', {
		usernames: 'user1,user2',
	});
}
