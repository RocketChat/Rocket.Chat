import { IOAuthApps } from '@rocket.chat/core-typings';
import type { IOAuthAppsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class OAuthApps extends ModelClass<IOAuthApps> implements IOAuthAppsModel {
	findOneAuthAppByIdOrClientId(props: { clientId: string } | { appId: string }): Promise<IOAuthApps | null> {
		return this.findOne({
			...('appId' in props && { _id: props.appId }),
			...('clientId' in props && { _id: props.clientId }),
		});
	}
}

const col = db.collection(`${prefix}oauth_apps`);
registerModel('IOAuthAppsModel', new OAuthApps(col, trashCollection) as IOAuthAppsModel);
