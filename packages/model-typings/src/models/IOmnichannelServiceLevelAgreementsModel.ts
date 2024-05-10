import type { IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IOmnichannelServiceLevelAgreementsModel extends IBaseModel<IOmnichannelServiceLevelAgreements> {
	findOneByIdOrName(_idOrName: string, options?: any): Promise<IOmnichannelServiceLevelAgreements | null>;
	createOrUpdatePriority(
		{ name, description, dueTimeInMinutes }: Pick<IOmnichannelServiceLevelAgreements, 'name' | 'description' | 'dueTimeInMinutes'>,
		_id: string | null,
	): Promise<Omit<IOmnichannelServiceLevelAgreements, '_updatedAt'>>;
	findDuplicate(
		_id: string | null,
		name: string,
		dueTimeInMinutes: number,
	): Promise<Pick<IOmnichannelServiceLevelAgreements, '_id'> | null>;
}
