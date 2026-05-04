import { faker } from '@faker-js/faker';
import type { IRoom } from '@rocket.chat/core-typings';
import type { GroupsCreateProps } from '@rocket.chat/rest-typings';

import type { BaseTest } from './test';

export async function createTargetPrivateChannel(api: BaseTest['api'], options?: Omit<GroupsCreateProps, 'name'>): Promise<string> {
	const name = faker.string.uuid();
	await api.post('/groups.create', { name, ...options });

	return name;
}

export async function createTargetGroupAndReturnFullRoom(
	api: BaseTest['api'],
	options?: Omit<GroupsCreateProps, 'name'>,
): Promise<{ group: IRoom }> {
	const name = faker.string.uuid();
	return (await api.post('/groups.create', { name, ...options })).json();
}
