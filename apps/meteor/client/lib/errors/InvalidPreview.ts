import { RocketChatError } from './RocketChatError';

export class InvalidPreview extends RocketChatError<'error-invalid-preview'> {
	constructor(message = 'Preview Item must have an id, type, and value.', details?: string) {
		super('error-invalid-preview', message, details);
	}
}
