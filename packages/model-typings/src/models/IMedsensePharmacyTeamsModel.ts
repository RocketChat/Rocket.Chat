import type { IMedsensePharmacyTeam } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMedsensePharmacyTeamsModel extends IBaseModel<IMedsensePharmacyTeam> {
	findByPharmacyId(pharmacyId: string, options?: FindOptions<IMedsensePharmacyTeam>): FindCursor<IMedsensePharmacyTeam>;
}
