import { Meteor } from 'meteor/meteor';

import { process2faAsyncReturn } from '../../../client/lib/2fa/process2faReturn';
import { isTotpInvalidError } from '../../../client/lib/2fa/utils';
import { t } from '../../utils/lib/i18n';

const { callAsync } = Meteor;

Meteor.call = function (): void {
	console.error('Meteor.call is not supported anymore');
};

Meteor.callAsync = async function _callAsyncWithTotp(methodName: string, ...args: unknown[]): Promise<unknown> {
	try {
		return await callAsync(methodName, ...args);
	} catch (error: unknown) {
		return process2faAsyncReturn({
			error,
			onCode: async (twoFactorCode, twoFactorMethod) => {
				try {
					await Meteor.callAsync(methodName, ...args, { twoFactorCode, twoFactorMethod });
				} catch (error) {
					if (isTotpInvalidError(error)) {
						throw new Error(twoFactorMethod === 'password' ? t('Invalid_password') : t('Invalid_two_factor_code'));
					}
					throw error;
				}
			},
			emailOrUsername: undefined,
		});
	}
};
