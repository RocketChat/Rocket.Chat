import { faker } from '@faker-js/faker';
import type { ChannelsCreateProps, GroupsCreateProps } from '@rocket.chat/rest-typings';

import type { BaseTest } from './test';

/**
 * createTargetChannel:
 *  - Usefull to create a target channel for message related tests
 */
export async function createTargetChannel(api: BaseTest['api'], options?: Omit<ChannelsCreateProps, 'name'>): Promise<string> {
	const name = faker.string.uuid();
	await api.post('/channels.create', { name, ...options });

	return name;
}

export async function createTargetPrivateChannel(api: BaseTest['api'], options?: Omit<GroupsCreateProps, 'name'>): Promise<string> {
	const name = faker.string.uuid();
	await api.post('/groups.create', { name, ...options });

	return name;
}

export async function createTargetTeam(api: BaseTest['api']): Promise<string> {
	const name = faker.string.uuid();
	await api.post('/teams.create', { name, type: 1, members: ['user2', 'user1'] });

	return name;
}

export async function createDirectMessage(api: BaseTest['api']): Promise<void> {
	await api.post('/dm.create', {
		usernames: 'user1,user2',
	});
}

export async function createTargetDiscussion(api: BaseTest['api']): Promise<string> {
	const channelName = faker.string.uuid();
	const discussionName = faker.string.uuid();

	const response = await api.post('/channels.create', { name: channelName });
	const { channel } = await response.json();
	await api.post('/rooms.createDiscussion', { t_name: discussionName, prid: channel._id});

	return discussionName;
}
