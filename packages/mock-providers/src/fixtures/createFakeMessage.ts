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
