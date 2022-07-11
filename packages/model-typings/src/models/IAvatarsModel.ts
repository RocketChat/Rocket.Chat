import type { DeleteResult, UpdateResult, Document } from 'mongodb';
import type { IAvatar } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IAvatarsModel extends IBaseModel<IAvatar> {
	insertAvatarFileInit(
		name: string,
		userId: string,
		store: string,
		file: { name: string },
		extra: object,
	): Promise<Document | UpdateResult>;
	updateFileComplete(fileId: string, userId: string, file: object): Promise<Document | UpdateResult> | undefined;
	findOneByName(name: string): Promise<IAvatar | null>;
	findOneByRoomId(rid: string): Promise<IAvatar | null>;
	updateFileNameById(fileId: string, name: string): Promise<Document | UpdateResult>;
	deleteFile(fileId: string): Promise<DeleteResult>;
}
