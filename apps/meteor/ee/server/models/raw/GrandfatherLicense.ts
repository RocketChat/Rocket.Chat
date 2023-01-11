import type { IGrandfatherLicense } from '@rocket.chat/core-typings';
import type { IGrandfatherLicenseModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription, InsertOneResult } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class GrandfatherLicenseRaw extends BaseRaw<IGrandfatherLicense> implements IGrandfatherLicenseModel {
	constructor(db: Db) {
		super(db, 'grandfather_license');
	}

	protected modelIndexes(): IndexDescription[] | undefined {
		return [{ key: { allowedModule: 1 }, unique: true }];
	}

	insertLicense(allowedModule: IGrandfatherLicense['allowedModule']): Promise<InsertOneResult<IGrandfatherLicense>> {
		return this.insertOne({ allowedModule });
	}
}
