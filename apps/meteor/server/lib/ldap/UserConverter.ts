import type { IImportUser, IUser } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import { Users } from '@rocket.chat/models';

import type { ConverterCache } from '../../../app/importer/server/classes/converters/ConverterCache';
import { type RecordConverterOptions } from '../../../app/importer/server/classes/converters/RecordConverter';
import { UserConverter, type UserConverterOptions } from '../../../app/importer/server/classes/converters/UserConverter';
import { settings } from '../../../app/settings/server';

export class LDAPUserConverter extends UserConverter {
	private mergeExistingUsers: boolean;

	constructor(options?: UserConverterOptions & RecordConverterOptions, logger?: Logger, cache?: ConverterCache) {
		const ldapOptions = {
			workInMemory: true,
			...(options || {}),
		};

		super(ldapOptions, logger, cache);
		this.mergeExistingUsers = settings.get<boolean>('LDAP_Merge_Existing_Users') ?? true;
	}

	async findExistingUser(data: IImportUser): Promise<IUser | undefined> {
		if (data.services?.ldap?.id) {
			const importedUser = await Users.findOneByLDAPId(data.services.ldap.id, data.services.ldap.idAttribute);
			if (importedUser) {
				return importedUser;
			}
		}

		if (!this.mergeExistingUsers) {
			return;
		}

		if (data.emails.length) {
			const emailUser = await Users.findOneWithoutLDAPByEmailAddress(data.emails[0], {});

			if (emailUser) {
				return emailUser;
			}
		}

		if (data.username) {
			return Users.findOneWithoutLDAPByUsernameIgnoringCase(data.username);
		}
	}

	static async convertSingleUser(userData: IImportUser, options?: UserConverterOptions): Promise<void> {
		const converter = new LDAPUserConverter(options);
		await converter.addObject(userData);
		await converter.convertData();
	}
}
