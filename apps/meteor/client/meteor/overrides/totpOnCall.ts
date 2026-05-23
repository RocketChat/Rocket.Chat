import { isTotpMaxAttemptsError } from '@rocket.chat/api-client';
import { Meteor } from 'meteor/meteor';

import { t } from '../../../app/utils/lib/i18n';
import { challenge2fa } from '../../lib/2fa/challenge2fa';
import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { process2faReturn, process2faAsyncReturn } from '../../lib/2fa/process2faReturn';
import { isTotpInvalidError, isTotpRequiredError } from '../../lib/2fa/utils';

const withSyncTOTP = (call: (name: string, ...args: any[]) => any) => {
	const callWithTotp =
		(methodName: string, args: unknown[], callback: LoginCallback) =>
		(twoFactorCode: string, twoFactorMethod: string): void =>
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
				// TODO fix this any
				const retryCall = async (error: any, result: unknown): Promise<void> => {
					if (!isTotpRequiredError(error) || !isTotpInvalidError(error) || !isTotpMaxAttemptsError(error)) {
						callback(error, result);
						return;
					}

					const challenge = challenge2fa({
						error,
						errorHandler: callback,
					});

					if (!challenge) {
						throw new Error('Unable to challenge 2fa');
					}

					const [code, resolveChallenge] = challenge;
					const resolvedCode = await code;

					// TODO: fix this hack
					// @ts-ignore
					const twoFactorMethod = error.details?.method || 'password';

					try {
						callWithTotp(methodName, args, (error, result) => {
							callback(error, result);
							retryCall(error, result);
						})(resolvedCode, twoFactorMethod);
					} catch (error) {
						resolveChallenge();
					}
				};

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

const withAsyncTOTP = <T extends (name: string, ...args: any[]) => Promise<any>>(callAsync: T): T => {
	return async function callAsyncWithTOTP(methodName: string, ...args: unknown[]): Promise<ReturnType<T>> {
		try {
			return await callAsync(methodName, ...args);
		} catch (error: unknown) {
			return process2faAsyncReturn({
				error,
				onCode: (twoFactorCode, twoFactorMethod) => Meteor.callAsync(methodName, ...args, { twoFactorCode, twoFactorMethod }),
				emailOrUsername: undefined,
			});
		}
	} as T;
};

Meteor.call = withSyncTOTP(Meteor.call);
Meteor.callAsync = withAsyncTOTP(Meteor.callAsync);
