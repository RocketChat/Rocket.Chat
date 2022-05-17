import { Meteor } from 'meteor/meteor';

import { t } from '../../utils/client';
import { process2faReturn } from '../../../client/lib/2fa/process2faReturn';
import { isTotpInvalidError } from '../../../client/lib/2fa/utils';
import { dispatchToastMessage } from '../../../client/lib/toast';

const { call } = Meteor;

type Callback = {
	(error: unknown): void;
	(error: unknown, result: unknown): void;
};

const callWithTotp =
	(methodName: string, args: unknown[], callback: Callback) =>
	(twoFactorCode: string, twoFactorMethod: string): unknown =>
		call(methodName, ...args, { twoFactorCode, twoFactorMethod }, (error: unknown, result: unknown): void => {
			if (isTotpInvalidError(error)) {
				(error as { toastrShowed?: true }).toastrShowed = true;
				dispatchToastMessage({
					type: 'error',
					message: twoFactorMethod === 'password' ? t('Invalid_password') : t('Invalid_two_factor_code'),
				});
				callback(error);
				return;
			}

			callback(error, result);
		});

const callWithoutTotp = (methodName: string, args: unknown[], callback: Callback) => (): unknown =>
	call(methodName, ...args, (error: unknown, result: unknown): void => {
		process2faReturn({
			error,
			result,
			onCode: callWithTotp(methodName, args, callback),
			originalCallback: callback,
			emailOrUsername: undefined,
		});
	});

Meteor.call = function (methodName: string, ...args: unknown[]): unknown {
	const callback = args.length > 0 && typeof args[args.length - 1] === 'function' ? (args.pop() as Callback) : (): void => undefined;

	return callWithoutTotp(methodName, args, callback)();
};
