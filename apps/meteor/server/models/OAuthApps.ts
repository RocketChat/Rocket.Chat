import { IOAuthApps } from '@rocket.chat/core-typings';

import { ModelClass } from './ModelClass';

export class OAuthApps extends ModelClass<IOAuthApps> {
	findOneAuthAppByIdOrClientId(props: { clientId: string } | { appId: string }): Promise<IOAuthApps | null> {
		return this.findOne({
			...('appId' in props && { _id: props.appId }),
			...('clientId' in props && { _id: props.clientId }),
		});
	}
}
