import type { ILDAPEntry } from '@rocket.chat/core-typings';

import { getLdapString } from './getLdapString';
import { ldapKeyExists } from './ldapKeyExists';

export function getLdapDynamicValue(ldapUser: ILDAPEntry, attributeSetting: string | undefined): string | undefined {
	if (!attributeSetting) {
		return;
	}

	// If the attribute setting is a template, then convert the variables in it
	if (attributeSetting.includes('#{')) {
		return attributeSetting.replace(/#{(.+?)}/g, (_match, field) => {
			const key = field.trim();

			if (ldapKeyExists(ldapUser, key)) {
				return getLdapString(ldapUser, key);
			}

			return '';
		});
	}

	// If it's not a template, then treat the setting as a CSV list of possible attribute names and return the first valid one.
	const attributeList: string[] = attributeSetting.replace(/\s/g, '').split(',');
	const key = attributeList.find((field) => ldapKeyExists(ldapUser, field));
	if (key) {
		return getLdapString(ldapUser, key);
	}
}
