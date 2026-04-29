import { useStream, useSessionDispatch } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

export const useForceLogout = (userId: string) => {
	const getNotifyUserStream = useStream('notify-user');
	const setForceLogout = useSessionDispatch('forceLogout');

	useEffect(() => {
		setForceLogout(false);

		const unsubscribe = getNotifyUserStream(`${userId}/force_logout`, () => {
			setForceLogout(true);

			// Trigger an actual local logout. With the SDK socket as the
			// transport, the legacy "server closes the WS, client reconnects,
			// loginWithToken fails, accounts-base bounces to Login" chain no
			// longer fires reliably: DDPSDK auto-retries loginWithToken on
			// every `connected` and swallows the rejection with `void`, so
			// the navbar stays on Home with stale credentials. Wipe Meteor's
			// stored login token + userId here so the router falls back to
			// /login.
			try {
				Accounts._unstoreLoginToken();
			} catch {
				// ignore
			}
			try {
				(Meteor.connection as unknown as { setUserId: (uid: string | null) => void }).setUserId(null);
			} catch {
				// ignore
			}
		});

		return unsubscribe;
	}, [getNotifyUserStream, setForceLogout, userId]);
};
