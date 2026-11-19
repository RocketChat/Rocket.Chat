import type { IUiKitView } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel.js';

export interface IUiKitViewsModel extends IBaseModel<IUiKitView> {
	saveView(view: Pick<IUiKitView, 'viewId' | 'appId' | 'userId' | 'type' | 'view'>): Promise<void>;
	findOneByIdForUser(viewId: IUiKitView['viewId'], appId: IUiKitView['appId'], userId: IUiKitView['userId']): Promise<IUiKitView | null>;
	findOneByExternalIdForUser(externalId: string, appId: IUiKitView['appId'], userId: IUiKitView['userId']): Promise<IUiKitView | null>;
}
