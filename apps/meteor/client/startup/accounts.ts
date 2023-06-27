import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { t } from '../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../lib/toast';

Accounts.onEmailVerificationLink((token: string) => {
	Accounts.verifyEmail(token, (error) => {
		if (error instanceof Meteor.Error && error.error === 'verify-email') {
			dispatchToastMessage({ type: 'success', message: t('Email_verified') });
			void sdk.call('afterVerifyEmail');
			return;
		}

		dispatchToastMessage({ type: 'error', message: error });
	});
});
