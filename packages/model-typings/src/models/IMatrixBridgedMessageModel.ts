import type { IMatrixBridgedMessage } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IMatrixBridgedMessageModel extends IBaseModel<IMatrixBridgedMessage> {
	getExternalEventId(localMessageId: string): Promise<string | null>;
	getLocalMessageId(externalEventId: string): Promise<string | null>;
	createOrUpdate(localMessageId: string, externalEventId: string): Promise<void>;
	removeByLocalMessageId(localMessageId: string): Promise<void>;
}
