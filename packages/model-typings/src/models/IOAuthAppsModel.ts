import type { IOAuthApps } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IOAuthAppsModel extends IBaseModel<IOAuthApps> {
	findOneAuthAppByIdOrClientId(props: { clientId: string } | { appId: string }): Promise<IOAuthApps | null>;
}
