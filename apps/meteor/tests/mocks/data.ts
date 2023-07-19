import { faker } from '@faker-js/faker';
import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { parse } from '@rocket.chat/message-parser';

import type { MessageWithMdEnforced } from '../../client/lib/parseMessageTextToAstMarkdown';

export function createFakeUser<TUser extends IUser>(overrides?: Partial<IUser> & Omit<TUser, keyof IUser>): TUser;
export function createFakeUser(overrides?: Partial<IUser>): IUser {
	return {
		_id: faker.database.mongodbObjectId(),
		_updatedAt: faker.date.recent(),
		username: faker.internet.userName(),
		name: faker.person.fullName(),
		createdAt: faker.date.recent(),
		roles: ['user'],
		active: faker.datatype.boolean(),
		type: 'user',
		...overrides,
	};
}

export const createFakeRoom = (overrides?: Partial<IRoom>): IRoom => ({
	_id: faker.database.mongodbObjectId(),
	_updatedAt: faker.date.recent(),
	t: faker.helpers.arrayElement(['c', 'p', 'd']),
	msgs: faker.number.int({ min: 0 }),
	u: {
		_id: faker.database.mongodbObjectId(),
		username: faker.internet.userName(),
		name: faker.person.fullName(),
		...overrides?.u,
	},
	usersCount: faker.number.int({ min: 0 }),
	autoTranslateLanguage: faker.helpers.arrayElement(['en', 'es', 'pt', 'ar', 'it', 'ru', 'fr']),
	...overrides,
});

export const createFakeSubscription = (overrides?: Partial<ISubscription>): ISubscription =>
	({
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
	} as ISubscription);

export function createFakeMessage<TMessage extends IMessage>(overrides?: Partial<IMessage> & Omit<TMessage, keyof IMessage>): TMessage;
export function createFakeMessage(overrides?: Partial<IMessage>): IMessage {
	return {
		_id: faker.database.mongodbObjectId(),
		_updatedAt: faker.date.recent(),
		rid: faker.database.mongodbObjectId(),
		msg: faker.lorem.sentence(),
		ts: faker.date.recent(),
		u: {
			_id: faker.database.mongodbObjectId(),
			username: faker.internet.userName(),
			name: faker.person.fullName(),
			...overrides?.u,
		},
		...overrides,
	};
}

export function createFakeMessageWithMd<TMessage extends IMessage>(
	overrides?: Partial<MessageWithMdEnforced<TMessage>>,
): MessageWithMdEnforced<TMessage>;
export function createFakeMessageWithMd(overrides?: Partial<MessageWithMdEnforced<IMessage>>): MessageWithMdEnforced<IMessage> {
	const fakeMessage = createFakeMessage(overrides);

	return {
		...fakeMessage,
		md: parse(fakeMessage.msg),
		...overrides,
	};
}
