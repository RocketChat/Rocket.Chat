import type { DeleteWriteOpResultObject, UpdateWriteOpResult } from 'mongodb';
import type { IAvatar } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IAvatarsModel extends IBaseModel<IAvatar> {
	insertAvatarFileInit(name: string, userId: string, store: string, file: { name: string }, extra: object): Promise<UpdateWriteOpResult>;
	updateFileComplete(fileId: string, userId: string, file: object): Promise<UpdateWriteOpResult> | undefined;
	findOneByName(name: string): Promise<IAvatar | null>;
	findOneByRoomId(rid: string): Promise<IAvatar | null>;
	updateFileNameById(fileId: string, name: string): Promise<UpdateWriteOpResult>;
	deleteFile(fileId: string): Promise<DeleteWriteOpResultObject>;
}
