import type { UserStatus } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';

import 'highlight.js/styles/github.css';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { onLoggedIn } from '../lib/loggedIn';
import { userIdStore } from '../lib/user';
import { removeLocalUserData, synchronizeUserData } from '../lib/userData';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';
import { Users } from '../stores';

let status: UserStatus | undefined = undefined;

const emitStatusChange = (next: UserStatus | undefined) => {
	if (next === status) return;
	status = next;
	fireGlobalEvent('status-changed', status);
};

onLoggedIn(async () => {
	const uid = userIdStore.getState();
	if (!uid) return;

	const user = await synchronizeUserData(uid);
	if (!user) return;

	const utcOffset = -new Date().getTimezoneOffset() / 60;
	if (user.utcOffset !== utcOffset) {
		sdk.call('userSetUtcOffset', utcOffset);
	}

	emitStatusChange(user.status);
});

Users.use.subscribe(() => {
	const uid = userIdStore.getState();
	if (!uid) return;
	const user = Users.use.getState().get(uid);
	if (!user) return;
	emitStatusChange(user.status);
});

Accounts.onLogout(() => {
	removeLocalUserData();
	status = undefined;
});

// Session-resume failure (expired stored token on page load): Meteor has already
// cleared Meteor.loginToken before this module runs, userId stays null, and no
// Accounts.onLogout callback fires for this scenario. Detect via the combination
// of missing token and missing uid at module init and clean up residual keys
// (e.g. E2EE public_key / private_key). Do NOT subscribe to userIdStore for this —
// the valid-session resume path is async and would clobber a valid token mid-flight.
if (!userIdStore.getState() && localStorage.getItem('Meteor.loginToken') === null) {
	removeLocalUserData();
}
