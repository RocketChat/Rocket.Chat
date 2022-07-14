import type { IOAuthApps, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IOAuthAppsModel } from '@rocket.chat/model-typings';
import type { Db, Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class OAuthAppsRaw extends BaseRaw<IOAuthApps> implements IOAuthAppsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IOAuthApps>>) {
		super(db, 'oauth_apps', trash);
	}

	findOneAuthAppByIdOrClientId(props: { clientId: string } | { appId: string }): Promise<IOAuthApps | null> {
		return this.findOne({
			...('appId' in props && { _id: props.appId }),
			...('clientId' in props && { _id: props.clientId }),
		});
	}
}
