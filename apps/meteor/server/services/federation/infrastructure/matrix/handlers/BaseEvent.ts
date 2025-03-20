import type { AbstractMatrixEvent } from '../definitions/AbstractMatrixEvent';

export abstract class MatrixBaseEventHandler {
	public abstract eventType: string;

	public abstract handle(externalEvent: AbstractMatrixEvent): Promise<void>;

	public equals(event: AbstractMatrixEvent): boolean {
		return this.eventType === event.type;
	}
}
