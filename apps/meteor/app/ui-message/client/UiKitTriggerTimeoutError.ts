import { RocketChatError } from '../../../client/lib/errors/RocketChatError';

export class UiKitTriggerTimeoutError extends RocketChatError<'trigger-timeout'> {
	constructor(message = 'Timeout', details: { triggerId: string; appId: string }) {
		super('trigger-timeout', message, details);
	}
}
