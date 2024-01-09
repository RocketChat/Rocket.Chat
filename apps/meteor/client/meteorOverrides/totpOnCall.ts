import { Meteor } from 'meteor/meteor';

import { t } from '../../app/utils/lib/i18n';
import type { LoginCallback } from '../lib/2fa/overrideLoginMethod';
import { process2faReturn, process2faAsyncReturn } from '../lib/2fa/process2faReturn';
import { isTotpInvalidError } from '../lib/2fa/utils';

const withSyncTOTP = (call: (name: string, ...args: any[]) => any) => {
	const callWithTotp =
		(methodName: string, args: unknown[], callback: LoginCallback) =>
		(twoFactorCode: string, twoFactorMethod: string): unknown =>
			call(
				methodName,
				...args,
				{ twoFactorCode, twoFactorMethod },
				(error: globalThis.Error | Meteor.Error | Meteor.TypedError | undefined, result: unknown): void => {
					if (isTotpInvalidError(error)) {
						callback(new Error(twoFactorMethod === 'password' ? t('Invalid_password') : t('Invalid_two_factor_code')));
						return;
					}

					callback(error, result);
				},
			);

	const callWithoutTotp = (methodName: string, args: unknown[], callback: LoginCallback) => (): unknown =>
		call(
			methodName,
			...args,
			async (error: globalThis.Error | Meteor.Error | Meteor.TypedError | undefined, result: unknown): Promise<void> => {
				await process2faReturn({
					error,
					result,
					onCode: callWithTotp(methodName, args, callback),
					originalCallback: callback,
					emailOrUsername: undefined,
				});
			},
		);

	return function (methodName: string, ...args: unknown[]): unknown {
		const callback = args.length > 0 && typeof args[args.length - 1] === 'function' ? (args.pop() as LoginCallback) : (): void => undefined;

		return callWithoutTotp(methodName, args, callback)();
	};
};

const withAsyncTOTP = (callAsync: (name: string, ...args: any[]) => Promise<any>) => {
	return async function callAsyncWithTOTP(methodName: string, ...args: unknown[]): Promise<unknown> {
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
};

Meteor.call = withSyncTOTP(Meteor.call);
Meteor.callAsync = withAsyncTOTP(Meteor.callAsync);
