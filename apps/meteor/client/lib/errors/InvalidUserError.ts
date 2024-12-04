import { RocketChatError } from './RocketChatError';

export class InvalidUserError extends RocketChatError<'invalid-user'> {
	constructor(message = 'Invalid user', details?: unknown) {
		super('invalid-user', message, details);
	}
}
