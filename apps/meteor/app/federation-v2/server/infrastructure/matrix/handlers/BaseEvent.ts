import type { IMatrixEvent } from '../definitions/IMatrixEvent';
import type { MatrixEventType } from '../definitions/MatrixEventType';

export abstract class MatrixBaseEventHandler<T extends MatrixEventType> {
	protected type: T;

	public abstract handle(externalEvent: IMatrixEvent<T>): Promise<void>;

	protected constructor(type: T) {
		this.type = type;
	}

	public equals(type: MatrixEventType): boolean {
		return this.type === type;
	}
}
