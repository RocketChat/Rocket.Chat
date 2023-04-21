import type { IOAuthApps } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IOAuthAppsModel extends IBaseModel<IOAuthApps> {
	findOneAuthAppByIdOrClientId(
		props:
			| { clientId: string }
			| { appId: string }
			| {
					_id: string;
			  },
	): Promise<IOAuthApps | null>;
}
