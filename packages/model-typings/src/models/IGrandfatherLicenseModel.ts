import type { InsertOneResult } from 'mongodb';
import type { IGrandfatherLicense } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IGrandfatherLicenseModel extends IBaseModel<IGrandfatherLicense> {
	insertLicense(allowedModule: IGrandfatherLicense['allowedModule']): Promise<InsertOneResult<IGrandfatherLicense>>;
}
