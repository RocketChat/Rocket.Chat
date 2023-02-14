import type { FindCursor } from 'mongodb';
import type { IPbxEvent } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IPbxEventsModel extends IBaseModel<IPbxEvent> {
	findByEvents(callUniqueId: string, events: string[]): FindCursor<IPbxEvent>;
	findOneByEvent(callUniqueId: string, event: string): Promise<IPbxEvent | null>;
	findOneByUniqueId(callUniqueId: string): Promise<IPbxEvent | null>;
}
