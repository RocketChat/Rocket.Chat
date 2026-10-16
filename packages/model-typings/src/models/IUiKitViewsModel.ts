import type { IUiKitView } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IUiKitViewsModel extends IBaseModel<IUiKitView> {
	saveView(view: Pick<IUiKitView, '_id' | 'appId' | 'userId' | 'type' | 'view'>): Promise<void>;
	findOneByIdForUser(viewId: IUiKitView['_id'], appId: IUiKitView['appId'], userId: IUiKitView['userId']): Promise<IUiKitView | null>;
}
