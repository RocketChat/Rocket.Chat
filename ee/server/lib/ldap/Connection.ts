import ldapjs from 'ldapjs';

import { LDAPConnection } from '../../../../server/lib/ldap/Connection';
import { logger, bindLogger } from '../../../../server/lib/ldap/Logger';
import { settings } from '../../../../app/settings/server';
import type { ILDAPEEConnectionOptions } from '../../../definition/ldap/ILDAPEEOptions';

export class LDAPEEConnection extends LDAPConnection {
	public eeOptions: ILDAPEEConnectionOptions;

	private usingAuthentication: boolean;

	constructor() {
		super();

		this.eeOptions = {
			authentication: settings.get<boolean>('LDAP_Authentication') ?? false,
			authenticationUserDN: settings.get<string>('LDAP_Authentication_UserDN') ?? '',
			authenticationPassword: settings.get<string>('LDAP_Authentication_Password') ?? '',
		};
	}

	/*
		Bind UserDN and Password if specified and not yet bound
	*/
	public async maybeBindDN(): Promise<void> {
		if (this.usingAuthentication) {
			return;
		}

		if (!this.eeOptions.authentication) {
			return;
		}

		if (!this.eeOptions.authenticationUserDN) {
			logger.error('Invalid UserDN for authentication');
			return;
		}

		bindLogger.info({ msg: 'Binding UserDN', userDN: this.eeOptions.authenticationUserDN });
		await this.bindDN(this.eeOptions.authenticationUserDN, this.eeOptions.authenticationPassword);
		this.usingAuthentication = true;
	}

	public disconnect(): void {
		this.usingAuthentication = false;
		super.disconnect();
	}

	public async testConnection(): Promise<void> {
		await super.testConnection();

		await this.maybeBindDN();
	}

	protected async runBeforeSearch(searchOptions: ldapjs.SearchOptions): Promise<void> {
		await this.maybeBindDN();

		if (!Array.isArray(searchOptions.attributes)) {
			searchOptions.attributes = searchOptions.attributes ? [searchOptions.attributes] : ['*'];
		}
		searchOptions.attributes.push('pwdAccountLockedTime');
		super.runBeforeSearch(searchOptions);
	}
}
