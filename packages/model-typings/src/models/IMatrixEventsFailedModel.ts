import type { IBaseModel } from './IBaseModel';

export interface IMatrixEventsFailedModel extends IBaseModel<any> {
	insertFailedEvent(event: any, reason: string): Promise<void>;
}
