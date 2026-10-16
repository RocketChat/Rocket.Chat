import type { IUiKitView } from '@rocket.chat/core-typings';
import type { IUiKitViewsModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

// ponytail: a day covers a form left open; an app that needs longer-lived views can refresh them by updating
const VIEW_TTL_MS = 24 * 60 * 60 * 1000;

export class UiKitViewsRaw extends BaseRaw<IUiKitView> implements IUiKitViewsModel {
	constructor(db: Db) {
		super(db, 'uikit_views');
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { expireAt: 1 }, expireAfterSeconds: 0 }];
	}

	async saveView({ _id, appId, userId, type, view }: Pick<IUiKitView, '_id' | 'appId' | 'userId' | 'type' | 'view'>): Promise<void> {
		await this.updateOne({ _id }, { $set: { appId, userId, type, view, expireAt: new Date(Date.now() + VIEW_TTL_MS) } }, { upsert: true });
	}

	findOneByIdForUser(viewId: IUiKitView['_id'], appId: IUiKitView['appId'], userId: IUiKitView['userId']): Promise<IUiKitView | null> {
		return this.findOne({ _id: viewId, appId, userId, expireAt: { $gt: new Date() } });
	}
}
