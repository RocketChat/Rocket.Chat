import { faker } from '@faker-js/faker';
import type { IMessage, MessageWithMdEnforced } from '@rocket.chat/core-typings';
import { parse } from '@rocket.chat/message-parser';

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

export function createFakeMessageWithAttachment<TMessage extends IMessage>(overrides?: Partial<TMessage>): TMessage;
export function createFakeMessageWithAttachment(overrides?: Partial<IMessage>): IMessage {
	const fakeMessage = createFakeMessage(overrides);
	const fileId = faker.database.mongodbObjectId();
	const fileName = faker.system.commonFileName('txt');

	return {
		...fakeMessage,
		msg: '',
		file: {
			_id: fileId,
			name: fileName,
			type: 'text/plain',
			size: faker.number.int(),
			format: faker.string.alpha(),
		},
		attachments: [
			{
				type: 'file',
				title: fileName,
				title_link: `/file-upload/${fileId}/${fileName}`,
			},
		],
		files: [
			{
				_id: fileId,
				name: fileName,
				type: 'text/plain',
				size: faker.number.int(),
				format: faker.string.alpha(),
			},
		],
		...overrides,
	};
}
