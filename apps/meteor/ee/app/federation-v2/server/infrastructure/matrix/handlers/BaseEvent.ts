import { IMatrixEventEE } from '../definitions/IMatrixEvent';
import { MatrixEventTypeEE } from '../definitions/MatrixEventType';

export abstract class MatrixBaseEventHandlerEE<T extends MatrixEventTypeEE> {
	private type: T;

	protected constructor(type: T) {
		this.type = type;
	}

	public abstract handle(externalEvent: IMatrixEventEE<T>): Promise<void>;

	public equals(type: MatrixEventTypeEE): boolean {
		return this.type === type;
	}
}
