import type { AbstractMatrixEvent } from '../definitions/AbstractMatrixEvent';
import type { MatrixBaseEventHandler } from './BaseEvent';

export class MatrixEventsHandler {
	// eslint-disable-next-line no-empty-function
	constructor(protected handlers: MatrixBaseEventHandler[]) {}

	public async handleEvent(event: AbstractMatrixEvent): Promise<void> {
		const handler = this.handlers.find((handler) => handler.equals(event));
		if (!handler) {
			return console.log(`Could not find handler for ${event.type}`, event);
		}
		try {
			await handler.handle(event);
		} catch (e: any) {
			throw new Meteor.Error(e.message);
		}
	}
}
