import type { IMatrixEvent } from '../definitions/IMatrixEvent';
import type { MatrixEventType } from '../definitions/MatrixEventType';
import type { MatrixBaseEventHandler } from './BaseEvent';

export class MatrixEventsHandler {
	// eslint-disable-next-line no-empty-function
	constructor(protected handlers: MatrixBaseEventHandler<MatrixEventType>[]) {}

	public async handleEvent(event: IMatrixEvent<MatrixEventType>): Promise<void> {
		const handler = this.handlers.find((handler) => handler.equals(event.type));
		if (!handler) {
			return console.log(`Could not find handler for ${event.type}`, event);
		}
		return handler?.handle(event);
	}
}
