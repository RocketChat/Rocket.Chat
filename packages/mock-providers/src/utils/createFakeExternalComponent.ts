import { faker } from '@faker-js/faker';
import type { IExternalComponentRoomInfo, IExternalComponentUserInfo } from '@rocket.chat/apps-engine/client/definition';

export const createFakeExternalComponentUserInfo = (partial: Partial<IExternalComponentUserInfo> = {}): IExternalComponentUserInfo => ({
	id: faker.database.mongodbObjectId(),
	username: faker.internet.userName(),
	avatarUrl: faker.image.avatar(),
	...partial,
});

export const createFakeExternalComponentRoomInfo = (partial: Partial<IExternalComponentRoomInfo> = {}): IExternalComponentRoomInfo => ({
	id: faker.database.mongodbObjectId(),
	members: faker.helpers.multiple(createFakeExternalComponentUserInfo),
	slugifiedName: faker.lorem.slug(),
	...partial,
});
