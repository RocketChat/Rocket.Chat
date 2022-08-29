import { useSetting } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useMemo } from 'react';

type Methods = 'loginWithLDAP' | 'loginWithCrowd' | 'loginWithPassword';

type LoginErrors =
	| 'error-user-is-not-activated'
	| 'error-invalid-email'
	| 'error-login-blocked-for-ip'
	| 'error-login-blocked-for-user'
	| 'error-license-user-limit-reached';

export const useLoginMethod = (callback: (error: LoginErrors) => void): ((username: string, password: string) => void) => {
	const isLdapEnabled = Boolean(useSetting('LDAP_Enable'));
	const isCrowdEnabled = Boolean(useSetting('CROWD_Enable'));

	const loginMethod: Methods = (isLdapEnabled && 'loginWithLDAP') || (isCrowdEnabled && 'loginWithCrowd') || 'loginWithPassword';

	if (isLdapEnabled && isCrowdEnabled) {
		if (process.env.NODE_ENV === 'development') {
			throw new Error('You can not use both LDAP and Crowd at the same time');
		}
		console.log('Both LDAP and Crowd are enabled. Please disable one of them.');
	}

	return useMemo(
		() =>
			(username: string, password: string): Promise<void> =>
				new Promise((resolve, reject) =>
					Meteor[loginMethod](username, password, (err, result) => {
						if (err) {
							reject(err);
						}

						return resolve(callback(result));
					}),
				),
		[loginMethod, callback],
	);
};
