import { faker } from '@faker-js/faker';
import type { IRoom } from '@rocket.chat/core-typings';
import type { ChannelsCreateProps } from '@rocket.chat/rest-typings';

import type { BaseTest } from './test';

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

export async function createArchivedChannel(api: BaseTest['api']): Promise<string> {
	const { channel } = await createTargetChannelAndReturnFullRoom(api);

	try {
		await api.post('/channels.archive', { roomId: channel._id });
	} catch (error) {
		throw new Error(`Error archiving the channel: ${error}`);
	}

	if (!channel.name) {
		throw new Error('Invalid channel was created');
	}

	return channel.name;
}
