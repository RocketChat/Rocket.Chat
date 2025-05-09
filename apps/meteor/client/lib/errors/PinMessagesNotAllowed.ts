import { RocketChatError } from './RocketChatError';

export class PinMessagesNotAllowed extends RocketChatError<'error-pinning-message'> {
	constructor(message = 'Pinning messages is not allowed', details?: unknown) {
		super('error-pinning-message', message, details);
	}
}
