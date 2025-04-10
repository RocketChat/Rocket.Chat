import { faker } from '@faker-js/faker';
import type { ISubscription } from '@rocket.chat/core-typings';

declare module '@rocket.chat/core-typings' {
	interface ISubscription {
		lowerCaseName: string;
		lowerCaseFName: string;
	}
}

export const createFakeSubscription = (overrides?: Partial<ISubscription>): ISubscription => ({
	_id: faker.database.mongodbObjectId(),
	_updatedAt: faker.date.recent(),
	u: {
		_id: faker.database.mongodbObjectId(),
		username: faker.internet.userName(),
		name: faker.person.fullName(),
		...overrides?.u,
	},
	rid: faker.database.mongodbObjectId(),
	open: faker.datatype.boolean(),
	ts: faker.date.recent(),
	name: faker.person.fullName(),
	unread: faker.number.int({ min: 0 }),
	t: faker.helpers.arrayElement(['c', 'p', 'd']),
	ls: faker.date.recent(),
	lr: faker.date.recent(),
	userMentions: faker.number.int({ min: 0 }),
	groupMentions: faker.number.int({ min: 0 }),
	lowerCaseName: faker.person.fullName().toLowerCase(),
	lowerCaseFName: faker.person.fullName().toLowerCase(),
	...overrides,
});

function generateOldKeys() {
	const amount = faker.number.int({ min: 1, max: 10 });
	const oldRoomKeys = [];
	for (let i = 0; i < amount; i++) {
		oldRoomKeys.push({
			E2EKey: faker.string.uuid(),
			ts: new Date(),
			e2eKeyId: faker.string.uuid().slice(12),
		});
	}
	return oldRoomKeys;
}

export function generateMultipleSubs(amount: number) {
	const subs = [];
	for (let i = 0; i < amount; i++) {
		subs.push(
			createFakeSubscription({
				_id: faker.string.uuid(),
				rid: faker.string.uuid(),
				name: faker.person.firstName(),
				t: 'd',
				alert: true,
				E2EKey: faker.datatype.boolean() ? faker.string.uuid() : undefined,
				E2ESuggestedKey: faker.datatype.boolean() ? faker.string.uuid() : undefined,
				oldRoomKeys: faker.datatype.boolean() ? generateOldKeys() : undefined,
				u: {
					_id: faker.person.firstName(),
				},
			}),
		);
	}
	return subs;
}
