import type { IOAuthApps, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOAuthAppsModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Db, Collection, IndexDescription, Document } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class OAuthAppsRaw extends BaseRaw<IOAuthApps> implements IOAuthAppsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOAuthApps>>) {
		super(db, 'oauth_apps', trash);
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { clientId: 1, clientSecret: 1 } }, { key: { appId: 1 } }];
	}

	findOneAuthAppByIdOrClientId<T extends Document = IOAuthApps, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		props: { clientId: string } | { appId: string } | { _id: string },
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>(
			{
				...('_id' in props && { _id: props._id }),
				...('appId' in props && { _id: props.appId }),
				...('clientId' in props && { clientId: props.clientId }),
			},
			options,
		);
	}

	findOneActiveByClientId<T extends Document = IOAuthApps, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		clientId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		if (typeof clientId !== 'string' || !clientId) {
			return Promise.resolve(null);
		}
		return this.findOne<T, O>(
			{
				active: true,
				clientId,
			},
			options,
		);
	}

	updateById(
		_id: IOAuthApps['_id'],
		data: Partial<Pick<IOAuthApps, 'name' | 'active' | 'redirectUri' | '_updatedBy'>>,
	): Promise<IOAuthApps | null> {
		return this.findOneAndUpdate({ _id }, { $set: data }, { returnDocument: 'after' });
	}

	findOneActiveByClientIdAndClientSecret<
		T extends Document = IOAuthApps,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(clientId: string, clientSecret: string, options?: O): Promise<DocumentWithProjection<T, O> | null> {
		if (typeof clientId !== 'string' || !clientId || typeof clientSecret !== 'string' || !clientSecret) {
			return Promise.resolve(null);
		}
		return this.findOne<T, O>(
			{
				active: true,
				clientId,
				clientSecret,
			},
			options,
		);
	}
}
