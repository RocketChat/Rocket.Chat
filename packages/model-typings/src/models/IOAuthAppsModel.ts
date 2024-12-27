import type { IOAuthApps } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IOAuthAppsModel extends IBaseModel<IOAuthApps> {
	findOneAuthAppByIdOrClientId(
		props:
			| { clientId: string }
			| { appId: string }
			| {
					_id: string;
			  },
		options?: FindOptions<IOAuthApps>,
	): Promise<IOAuthApps | null>;

	findOneActiveByClientId(clientId: string, options?: FindOptions<IOAuthApps>): Promise<IOAuthApps | null>;

	findOneActiveByClientIdAndClientSecret(
		clientId: string,
		clientSecret: string,
		options?: FindOptions<IOAuthApps>,
	): Promise<IOAuthApps | null>;
}
