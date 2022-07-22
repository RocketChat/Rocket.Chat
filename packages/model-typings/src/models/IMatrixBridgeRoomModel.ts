import type { IMatrixBridgedRoom } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IMatrixBridgedRoomModel extends IBaseModel<IMatrixBridgedRoom> {
	getExternalRoomId(localRoomId: string): Promise<string | null>;
	getLocalRoomId(externalRoomId: string): Promise<string | null>;
}
