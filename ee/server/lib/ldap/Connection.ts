import ldapjs from 'ldapjs';

import { LDAPConnection } from '../../../../server/lib/ldap/Connection';
import { logger, bindLogger, searchLogger } from '../../../../server/lib/ldap/Logger';
import { settings } from '../../../../app/settings/server';
import type { ILDAPEEConnectionOptions } from '../../../definition/ldap/ILDAPEEOptions';

export class LDAPEEConnection extends LDAPConnection {
	public eeOptions: ILDAPEEConnectionOptions;

	private usingAuthentication: boolean;

	constructor() {
		super();

		this.eeOptions = {
			authentication: settings.getAs<boolean>('LDAP_Authentication'),
			authenticationUserDN: settings.getAs<string>('LDAP_Authentication_UserDN'),
			authenticationPassword: settings.getAs<string>('LDAP_Authentication_Password'),
			groupFilterEnabled: settings.getAs<boolean>('LDAP_Group_Filter_Enable'),
			groupFilterObjectClass: settings.getAs<string>('LDAP_Group_Filter_ObjectClass'),
			groupFilterGroupIdAttribute: settings.getAs<string>('LDAP_Group_Filter_Group_Id_Attribute'),
			groupFilterGroupMemberAttribute: settings.getAs<string>('LDAP_Group_Filter_Group_Member_Attribute'),
			groupFilterGroupMemberFormat: settings.getAs<string>('LDAP_Group_Filter_Group_Member_Format'),
			groupFilterGroupName: settings.getAs<string>('LDAP_Group_Filter_Group_Name'),
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

	public isUserInGroup(username: string, userdn: string): boolean {
		if (!this.eeOptions.groupFilterEnabled) {
			return true;
		}

		const filter = ['(&'];

		if (this.eeOptions.groupFilterObjectClass !== '') {
			filter.push(`(objectclass=${ this.eeOptions.groupFilterObjectClass })`);
		}

		if (this.eeOptions.groupFilterGroupMemberAttribute !== '') {
			filter.push(`(${ this.eeOptions.groupFilterGroupMemberAttribute }=${ this.eeOptions.groupFilterGroupMemberFormat })`);
		}

		if (this.eeOptions.groupFilterGroupIdAttribute !== '') {
			filter.push(`(${ this.eeOptions.groupFilterGroupIdAttribute }=${ this.eeOptions.groupFilterGroupName })`);
		}
		filter.push(')');

		const searchOptions: ldapjs.SearchOptions = {
			filter: filter.join('').replace(/#{username}/g, username).replace(/#{userdn}/g, userdn),
			scope: 'sub',
		};

		searchLogger.debug({ msg: 'Group filter LDAP:', filter: searchOptions.filter });

		const result = this.searchRaw(this.options.baseDN, searchOptions);

		if (!Array.isArray(result) || result.length === 0) {
			return false;
		}
		return true;
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
