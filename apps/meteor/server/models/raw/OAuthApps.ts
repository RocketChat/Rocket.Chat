import { IOAuthApps } from '@rocket.chat/core-typings';
import type { IOAuthAppsModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class OAuthAppsRaw extends BaseRaw<IOAuthApps> implements IOAuthAppsModel {
	findOneAuthAppByIdOrClientId(props: { clientId: string } | { appId: string }): Promise<IOAuthApps | null> {
		return this.findOne({
			...('appId' in props && { _id: props.appId }),
			...('clientId' in props && { _id: props.clientId }),
		});
	}
}
