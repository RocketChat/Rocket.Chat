import faker from '@faker-js/faker';
import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { parse } from '@rocket.chat/message-parser';

import type { MessageWithMdEnforced } from '../../client/lib/parseMessageTextToAstMarkdown';

export const createFakeRoom = (overrides?: Partial<IRoom>): IRoom => ({
	_id: faker.database.mongodbObjectId(),
	_updatedAt: faker.date.recent(),
	t: faker.helpers.arrayElement(['c', 'p', 'd']),
	msgs: faker.datatype.number({ min: 0 }),
	u: {
		_id: faker.database.mongodbObjectId(),
		username: faker.internet.userName(),
		name: faker.name.findName(),
		...overrides?.u,
	},
	usersCount: faker.datatype.number({ min: 0 }),
	autoTranslateLanguage: faker.random.locale(),
	...overrides,
});

export const createFakeSubscription = (overrides?: Partial<ISubscription>): ISubscription => ({
	_id: faker.database.mongodbObjectId(),
	_updatedAt: faker.date.recent(),
	u: {
		_id: faker.database.mongodbObjectId(),
		username: faker.internet.userName(),
		name: faker.name.findName(),
		...overrides?.u,
	},
	rid: faker.database.mongodbObjectId(),
	open: faker.datatype.boolean(),
	ts: faker.date.recent(),
	name: faker.name.findName(),
	unread: faker.datatype.number({ min: 0 }),
	t: faker.helpers.arrayElement(['c', 'p', 'd']),
	ls: faker.date.recent(),
	lr: faker.date.recent(),
	userMentions: faker.datatype.number({ min: 0 }),
	groupMentions: faker.datatype.number({ min: 0 }),
	...overrides,
});

export function createFakeMessage<TMessage extends IMessage>(overrides?: Partial<TMessage>): TMessage;
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
			name: faker.name.findName(),
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
