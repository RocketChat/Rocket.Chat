import type { IImportUser, IUser } from '@rocket.chat/core-typings';

import { VirtualDataConverter } from '../../../app/importer/server/classes/VirtualDataConverter';
import type { IConverterOptions } from '../../../app/importer/server/classes/ImportDataConverter';
import { Logger } from '../logger/Logger';
import { Users } from '../../../app/models/server/raw';
import { settings } from '../../../app/settings/server';

const logger = new Logger('LDAP Data Converter');

export class LDAPDataConverter extends VirtualDataConverter {
	private mergeExistingUsers: boolean;

	constructor(virtual = true, options?: IConverterOptions) {
		super(virtual, options);
		this.setLogger(logger);

		this.mergeExistingUsers = settings.get<boolean>('LDAP_Merge_Existing_Users') ?? true;
	}

	findExistingUser(data: IImportUser): IUser | undefined {
		if (data.services?.ldap?.id) {
			const importedUser = Promise.await(Users.findOneByLDAPId(data.services.ldap.id, data.services.ldap.idAttribute));
			if (importedUser) {
				return importedUser;
			}
		}

		if (!this.mergeExistingUsers) {
			return;
		}

		// Search by email and username
		return super.findExistingUser(data);
	}

	static convertSingleUser(userData: IImportUser, options?: IConverterOptions): void {
		const converter = new LDAPDataConverter(true, options);
		converter.addUser(userData);
		converter.convertUsers();
	}
}
