import { Meteor } from 'meteor/meteor';

import { process2faReturn, process2faAsyncReturn } from '../../../client/lib/2fa/process2faReturn';
import { isTotpInvalidError } from '../../../client/lib/2fa/utils';
import { t } from '../../utils/lib/i18n';

const { call, callAsync } = Meteor;

type Callback = {
	(error: unknown): void;
	(error: unknown, result: unknown): void;
};

const callWithTotp =
	(methodName: string, args: unknown[], callback: Callback) =>
	(twoFactorCode: string, twoFactorMethod: string): unknown =>
		call(methodName, ...args, { twoFactorCode, twoFactorMethod }, (error: unknown, result: unknown): void => {
			if (isTotpInvalidError(error)) {
				callback(new Error(twoFactorMethod === 'password' ? t('Invalid_password') : t('Invalid_two_factor_code')));
				return;
			}

			callback(error, result);
		});

const callWithoutTotp = (methodName: string, args: unknown[], callback: Callback) => (): unknown =>
	call(methodName, ...args, async (error: unknown, result: unknown): Promise<void> => {
		await process2faReturn({
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

Meteor.callAsync = async function _callAsyncWithTotp(methodName: string, ...args: unknown[]): Promise<unknown> {
	try {
		return await callAsync(methodName, ...args);
	} catch (error: unknown) {
		return process2faAsyncReturn({
			error,
			onCode: (twoFactorCode, twoFactorMethod) => Meteor.callAsync(methodName, ...args, { twoFactorCode, twoFactorMethod }),
			emailOrUsername: undefined,
		});
	}
};
