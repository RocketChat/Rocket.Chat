import { faker } from '@faker-js/faker';

import type { BaseTest } from './test';

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

export async function createDiscussion(api: BaseTest['api'], parentRoomId: string, parentMessageId: string, name: string): Promise<string> {
	const response = await api.post('/rooms.createDiscussion', {
		prid: parentRoomId,
		pmid: parentMessageId,
		t_name: name,
	});

	const data: { success?: boolean; discussion?: { _id: string } } = await response.json();

	if (!data.discussion?._id) {
		throw new Error(`Error creating discussion: ${JSON.stringify(data)}`);
	}

	return data.discussion._id;
}
