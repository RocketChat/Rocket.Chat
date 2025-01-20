import type { IRoom } from '@rocket.chat/core-typings';

import { RocketChatError } from './RocketChatError';

type NotSubscribedToRoomErrorDetails = { rid: IRoom['_id'] };

export class NotSubscribedToRoomError extends RocketChatError<'not-subscribed-room', NotSubscribedToRoomErrorDetails> {
	public declare readonly reason: string;

	public declare readonly details: NotSubscribedToRoomErrorDetails;

	constructor(message = 'Not subscribed to this room', details: NotSubscribedToRoomErrorDetails) {
		super('not-subscribed-room', message, details);
	}
}
