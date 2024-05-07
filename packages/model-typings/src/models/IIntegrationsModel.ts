import type { IIntegration, IUser } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IIntegrationsModel extends IBaseModel<IIntegration> {
	disableByUserId(userId: IIntegration['_id']): ReturnType<IBaseModel<IIntegration>['updateMany']>;
	findByChannels(channels: IIntegration['channel']): FindCursor<IIntegration>;
	findByUserId(userId: IIntegration['_id']): FindCursor<IIntegration>;
	findOneByIdAndCreatedByIfExists(params: { _id: IIntegration['_id']; createdBy?: IUser['_id'] }): Promise<IIntegration | null>;
	findOneByUrl(url: string): Promise<IIntegration | null>;
	updateRoomName(oldRoomName: string, newRoomName: string): ReturnType<IBaseModel<IIntegration>['updateMany']>;
}
