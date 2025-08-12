import { faker } from '@faker-js/faker';
import type { IRoom, IMessage } from '@rocket.chat/core-typings';
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

export async function createTargetChannelAndReturnFullRoom(
	api: BaseTest['api'],
	options?: Omit<ChannelsCreateProps, 'name'>,
): Promise<{ channel: IRoom }> {
	const name = faker.string.uuid();
	return (await api.post('/channels.create', { name, ...options })).json();
}

export async function sendTargetChannelMessage(api: BaseTest['api'], roomName: string, options?: Partial<IMessage>) {
	const response = await api.get(`/channels.info?roomName=${roomName}`);

	const {
		channel: { _id: rid },
	}: { channel: IRoom } = await response.json();

	await api.post('/chat.sendMessage', {
		message: {
			rid,
			msg: options?.msg || 'simple message',
			...options,
		},
	});

	return options?.msg || 'simple message';
}

export async function deleteChannel(api: BaseTest['api'], roomName: string): Promise<void> {
	await api.post('/channels.delete', { roomName });
}

export async function deleteRoom(api: BaseTest['api'], roomId: string): Promise<void> {
	await api.post('/rooms.delete', { roomId });
}

export async function createTargetPrivateChannel(api: BaseTest['api'], options?: Omit<GroupsCreateProps, 'name'>): Promise<string> {
	const name = faker.string.uuid();
	await api.post('/groups.create', { name, ...options });

	return name;
}

export async function createTargetTeam(
	api: BaseTest['api'],
	options?: { sidepanel?: IRoom['sidepanel'] } & Omit<GroupsCreateProps, 'name'>,
): Promise<string> {
	const name = faker.string.uuid();
	await api.post('/teams.create', { name, type: 1, members: ['user2', 'user1'], ...options });

	return name;
}

export async function deleteTeam(api: BaseTest['api'], teamName: string): Promise<void> {
	await api.post('/teams.delete', { teamName });
}

export async function createDirectMessage(api: BaseTest['api']): Promise<void> {
	await api.post('/dm.create', {
		usernames: 'user1,user2',
	});
}

export async function createTargetDiscussion(api: BaseTest['api']): Promise<Record<string, string>> {
	const channelName = faker.string.uuid();
	const discussionName = faker.string.uuid();

	const channelResponse = await api.post('/channels.create', { name: channelName });
	const { channel } = await channelResponse.json();
	const discussionResponse = await api.post('/rooms.createDiscussion', { t_name: discussionName, prid: channel._id });
	const { discussion } = await discussionResponse.json();

	if (!discussion) {
		throw new Error('Discussion not created');
	}

	return discussion;
}

export async function createChannelWithTeam(api: BaseTest['api']): Promise<Record<string, string>> {
	const channelName = faker.string.uuid();
	const teamName = faker.string.uuid();

	const teamResponse = await api.post('/teams.create', { name: teamName, type: 1, members: ['user2'] });
	const { team } = await teamResponse.json();

	await api.post('/channels.create', { name: channelName, members: ['user1'], extraData: { teamId: team._id } });

	return { channelName, teamName };
}
