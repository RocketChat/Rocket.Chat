import { RocketChatError } from './RocketChatError';

export class NotAuthorizedError extends RocketChatError<'not-authorized'> {
	constructor(message = 'Not authorized', details?: string) {
		super('not-authorized', message, details);
	}
}
