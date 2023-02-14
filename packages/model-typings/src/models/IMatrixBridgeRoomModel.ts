import type { IMatrixBridgedRoom } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IMatrixBridgedRoomModel extends IBaseModel<IMatrixBridgedRoom> {
	getExternalRoomId(localRoomId: string): Promise<string | null>;
	getLocalRoomId(externalRoomId: string): Promise<string | null>;
	removeByLocalRoomId(localRoomId: string): Promise<void>;
	createOrUpdateByLocalRoomId(localRoomId: string, externalRoomId: string): Promise<void>;
}
