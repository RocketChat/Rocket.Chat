import type { IRoom, RoomType } from '@rocket.chat/core-typings';

import { RocketChatError } from './RocketChatError';

type RoomNotFoundErrorDetails =
	| { rid: IRoom['_id'] }
	| {
			type: RoomType;
			reference: string;
	  };

export class RoomNotFoundError extends RocketChatError<'room-not-found', RoomNotFoundErrorDetails> {
	constructor(message = 'Room not found', details: RoomNotFoundErrorDetails) {
		super('room-not-found', message, details);
	}
}
