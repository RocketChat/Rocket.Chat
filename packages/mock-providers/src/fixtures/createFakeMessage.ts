import type { IMessage } from '@rocket.chat/core-typings';

import { FIXTURE_EPOCH, nextFixtureId } from './sequence';

export function createFakeMessage<TMessage extends IMessage>(overrides?: Partial<IMessage> & Omit<TMessage, keyof IMessage>): TMessage;
export function createFakeMessage(overrides?: Partial<IMessage>): IMessage {
	const _id = overrides?._id ?? nextFixtureId('message');

	return {
		_id,
		_updatedAt: FIXTURE_EPOCH,
		rid: 'room',
		msg: `Message ${_id}`,
		ts: FIXTURE_EPOCH,
		...overrides,
		u: {
			_id: 'author',
			username: 'author',
			name: 'Author',
			...overrides?.u,
		},
	};
}

export function createFakeMessageWithAttachment<TMessage extends IMessage>(overrides?: Partial<TMessage>): TMessage;
export function createFakeMessageWithAttachment(overrides?: Partial<IMessage>): IMessage {
	const fileId = nextFixtureId('file');
	const fileName = `${fileId}.txt`;
	const file = { _id: fileId, name: fileName, type: 'text/plain', size: 1024, format: 'txt' };

	return createFakeMessage({
		msg: '',
		file,
		files: [file],
		attachments: [
			{
				type: 'file',
				title: fileName,
				title_link: `/file-upload/${fileId}/${fileName}`,
			},
		],
		...overrides,
	});
}

/**
 * Builds a conversation of `count` messages, oldest first, `minutesApart` minutes from each other and ending at `endsAt`.
 */
export const createFakeConversation = ({
	count,
	endsAt = FIXTURE_EPOCH,
	minutesApart = 1,
	build = (index) => ({ u: { _id: index % 2 ? 'author' : 'viewer', username: index % 2 ? 'author' : 'viewer' } }),
}: {
	count: number;
	endsAt?: Date;
	minutesApart?: number;
	build?: (index: number) => Partial<IMessage>;
}): IMessage[] =>
	Array.from({ length: count }, (_, index) =>
		createFakeMessage({
			ts: new Date(endsAt.getTime() - (count - 1 - index) * minutesApart * 60_000),
			...build(index),
		}),
	);
