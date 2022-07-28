import type { IIntegration, IUser } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IIntegrationsModel extends IBaseModel<IIntegration> {
	findOneByUrl(url: string): Promise<IIntegration | null>;
	updateRoomName(oldRoomName: string, newRoomName: string): ReturnType<IBaseModel<IIntegration>['updateMany']>;
	findOneByIdAndCreatedByIfExists(params: { _id: IIntegration['_id']; createdBy?: IUser['_id'] }): Promise<IIntegration | null>;
	disableByUserId(userId: string): ReturnType<IBaseModel<IIntegration>['updateMany']>;
}
