import type { IOAuthApps, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOAuthAppsModel } from '@rocket.chat/model-typings';
import type { Db, Collection, FindOptions, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class OAuthAppsRaw extends BaseRaw<IOAuthApps> implements IOAuthAppsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOAuthApps>>) {
		super(db, 'oauth_apps', trash);
	}

	modelIndexes(): IndexDescription[] {
		return [{ key: { clientId: 1, clientSecret: 1 } }, { key: { appId: 1 } }];
	}

	findOneAuthAppByIdOrClientId(
		props: { clientId: string } | { appId: string } | { _id: string },
		options?: FindOptions<IOAuthApps>,
	): Promise<IOAuthApps | null> {
		return this.findOne(
			{
				...('_id' in props && { _id: props._id }),
				...('appId' in props && { _id: props.appId }),
				...('clientId' in props && { clientId: props.clientId }),
			},
			options,
		);
	}

	findOneActiveByClientId(clientId: string, options?: FindOptions<IOAuthApps>): Promise<IOAuthApps | null> {
		return this.findOne(
			{
				active: true,
				clientId,
			},
			options,
		);
	}

	findOneActiveByClientIdAndClientSecret(
		clientId: string,
		clientSecret: string,
		options?: FindOptions<IOAuthApps>,
	): Promise<IOAuthApps | null> {
		return this.findOne(
			{
				active: true,
				clientId,
				clientSecret,
			},
			options,
		);
	}
}
