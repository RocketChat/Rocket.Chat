import type { IUiKitView } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IUiKitViewsModel extends IBaseModel<IUiKitView> {
	saveView(view: Pick<IUiKitView, '_id' | 'appId' | 'userId' | 'type' | 'view'>): Promise<void>;
	saveHomeView(view: Pick<IUiKitView, '_id' | 'appId' | 'userId' | 'view'>): Promise<void>;
	findHomeViewByAppIdAndUserId(appId: IUiKitView['appId'], userId: IUiKitView['userId']): Promise<IUiKitView | null>;
	findOneByIdForUser(viewId: IUiKitView['_id'], appId: IUiKitView['appId'], userId: IUiKitView['userId']): Promise<IUiKitView | null>;
	findOneByExternalIdForUser(externalId: string, appId: IUiKitView['appId'], userId: IUiKitView['userId']): Promise<IUiKitView | null>;
}
