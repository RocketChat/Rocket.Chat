import type { IInstalledLicense } from '@rocket.chat/core-typings';
import type { IInstalledLicenseModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription, FindOptions, FindCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class InstalledLicensesRaw extends BaseRaw<IInstalledLicense> implements IInstalledLicenseModel {
	constructor(db: Db) {
		super(db, 'installed_licenses');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { encryptedValue: 1 } }];
	}

	findOneByEncryptedValue(encryptedValue: string, options: FindOptions<IInstalledLicense>): Promise<IInstalledLicense | null> {
		const query = { encryptedValue };
		return this.findOne(query, options);
	}

	findByVersion(version: string, options: FindOptions<IInstalledLicense>): FindCursor<IInstalledLicense> {
		const query = { version };
		return this.find(query, options);
	}
}
