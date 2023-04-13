import { useSetting } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

import type { LoginMethods } from '../UserProvider';

export function useLDAPAndCrowdCollisionWarning() {
	const isLdapEnabled = useSetting<boolean>('LDAP_Enable');
	const isCrowdEnabled = useSetting<boolean>('CROWD_Enable');

	const loginMethod: LoginMethods = (isLdapEnabled && 'loginWithLDAP') || (isCrowdEnabled && 'loginWithCrowd') || 'loginWithPassword';

	useEffect(() => {
		if (isLdapEnabled && isCrowdEnabled) {
			if (process.env.NODE_ENV === 'development') {
				throw new Error('You can not use both LDAP and Crowd at the same time');
			}
			console.log('Both LDAP and Crowd are enabled. Please disable one of them.');
		}
		if (!Meteor[loginMethod]) {
			if (process.env.NODE_ENV === 'development') {
				throw new Error(`Meteor.${loginMethod} is not defined`);
			}
			console.log(`Meteor.${loginMethod} is not defined`);
		}
	}, [isLdapEnabled, isCrowdEnabled, loginMethod]);
}
