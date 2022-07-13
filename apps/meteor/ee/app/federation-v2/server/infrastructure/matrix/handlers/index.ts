import { IMatrixEventEE } from '../definitions/IMatrixEvent';
import { MatrixEventTypeEE } from '../definitions/MatrixEventType';
import { MatrixBaseEventHandlerEE } from './BaseEvent';

export class MatrixEventsHandlerEE {
	// eslint-disable-next-line no-empty-function
	constructor(private handlers: MatrixBaseEventHandlerEE<MatrixEventTypeEE>[]) {}

	public async handleEvent(event: IMatrixEventEE<MatrixEventTypeEE>): Promise<void> {
		const handler = this.handlers.find((handler) => handler.equals(event.type));
		if (!handler) {
			return console.log(`Could not find handler for ${event.type}`, event);
		}
		return handler?.handle(event);
	}
}
