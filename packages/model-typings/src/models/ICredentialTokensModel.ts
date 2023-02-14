import type { ICredentialToken } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ICredentialTokensModel extends IBaseModel<ICredentialToken> {
	create(_id: string, userInfo: ICredentialToken['userInfo']): Promise<ICredentialToken>;
	findOneNotExpiredById(_id: string): Promise<ICredentialToken | null>;
}
