import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { mainReady } from '../../app/ui-utils/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { t } from '../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../lib/toast';

Accounts.onEmailVerificationLink((token: string) => {
	Accounts.verifyEmail(token, (error) => {
		Tracker.autorun(() => {
			if (mainReady.get()) {
				if (error) {
					dispatchToastMessage({ type: 'error', message: error });
					throw new Meteor.Error('verify-email', 'E-mail not verified');
				} else {
					Tracker.nonreactive(() => {
						void sdk.call('afterVerifyEmail');
					});
					dispatchToastMessage({ type: 'success', message: t('Email_verified') });
				}
			}
		});
	});
});
