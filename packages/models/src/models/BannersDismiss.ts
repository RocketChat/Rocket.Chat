import type { IBannerDismiss, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IBannersDismissModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class BannersDismissRaw extends BaseRaw<IBannerDismiss> implements IBannersDismissModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IBannerDismiss>>) {
		super(db, 'banner_dismiss', trash);
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { userId: 1, bannerId: 1 } }];
	}

	findByUserIdAndBannerId<P extends Document = IBannerDismiss, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(userId: string, bannerIds: string[], options?: O): FindCursor<DocumentWithProjection<P, O>> {
		const query = {
			userId,
			bannerId: { $in: bannerIds },
		};

		return options ? this.col.find(query, options) : this.col.find(query);
	}
}
