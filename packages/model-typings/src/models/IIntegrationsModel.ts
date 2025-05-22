import type { IIntegration, IUser } from '@rocket.chat/core-typings';
import type { FindCursor, WithId } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IIntegrationsModel extends IBaseModel<IIntegration> {
	disableByUserId(userId: IIntegration['userId']): ReturnType<IBaseModel<IIntegration>['updateMany']>;
	findByChannels(channels: IIntegration['channel']): FindCursor<IIntegration>;
	findByUserId(userId: IIntegration['userId']): FindCursor<Pick<IIntegration, '_id'>>;
	findOneByIdAndCreatedByIfExists(params: { _id: IIntegration['_id']; createdBy?: IUser['_id'] }): Promise<IIntegration | null>;
	findOneByUrl(url: string): Promise<IIntegration | null>;
	updateRoomName(oldRoomName: string, newRoomName: string): ReturnType<IBaseModel<IIntegration>['updateMany']>;
	findOneByIdAndToken(id: IIntegration['_id'], token: string): Promise<WithId<IIntegration> | null>;
	findOneByIdAndToken<P>(id: IIntegration['_id'], token: string): Promise<WithId<P> | null>;
}
