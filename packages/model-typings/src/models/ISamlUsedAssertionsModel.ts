import type { ISamlUsedAssertions } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ISamlUsedAssertionsModel extends IBaseModel<ISamlUsedAssertions> {
	markUsed(assertionId: string, issuer: string, expireAt: Date): Promise<boolean>;
}
