import type { IMedsensePharmacyMembership } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMedsensePharmacyMembershipsModel extends IBaseModel<IMedsensePharmacyMembership> {
	findByUserId(userId: string, options?: FindOptions<IMedsensePharmacyMembership>): FindCursor<IMedsensePharmacyMembership>;
	findByPharmacyId(pharmacyId: string, options?: FindOptions<IMedsensePharmacyMembership>): FindCursor<IMedsensePharmacyMembership>;
}
