import type { TwoFactorErrorResponse } from '@rocket.chat/api-client';
import { Accounts } from 'meteor/accounts-base';

import type { MeteorErrorLike } from './types';
import { isTotpInvalidError, isTotpRequiredError } from './utils';

export type LoginCallback = (error: MeteorErrorLike | undefined, result?: unknown) => void;

export const overrideLoginMethod = <TArgs extends any[]>(
	loginMethod: (...args: [...args: TArgs, cb: LoginCallback]) => void,
	loginArgs: TArgs,
	callback: LoginCallback | undefined,
	loginMethodTOTP: (...args: [...args: TArgs, code: string, cb: LoginCallback]) => void,
) => {
	loginMethod(...loginArgs, async (error: MeteorErrorLike | undefined, result?: unknown) => {
		if (!isTotpRequiredError(error)) {
			callback?.(error);
			return error;
		}

		// const { process2faReturn } = await import('./process2faReturn');
		const { challenge2fa } = await import('./challenge2fa');

		const retryLogin = async (error: (TwoFactorErrorResponse & MeteorErrorLike) | undefined, result?: unknown) => {
			if (!error) {
				callback?.(undefined, result);
				return;
			}
			const challenge = challenge2fa({
				error,
				errorHandler: () => callback?.(error, result),
				emailOrUsername: typeof loginArgs[0] === 'string' ? loginArgs[0] : undefined,
			});

			if (!challenge) {
				throw new Error('Unable to challenge 2fa');
			}

			const [code, resolveChallenge] = challenge;
			const resolvedCode = await code;

			loginMethodTOTP(...loginArgs, resolvedCode, (error: MeteorErrorLike | undefined, result?: unknown) => {
				if (!error) {
					callback?.(undefined, result);
					resolveChallenge();
					return;
				}

				if (isTotpInvalidError(error)) {
					retryLogin(error, result);
				}
			});
		};

		retryLogin(error, result);
	});
};

export const handleLogin = <TLoginFunction extends (...args: any[]) => Promise<any>>(
	login: TLoginFunction,
	loginWithTOTP: (...args: [...args: Parameters<TLoginFunction>, code: string]) => ReturnType<TLoginFunction>,
) => {
	return (...args: [...loginArgs: Parameters<TLoginFunction>, callback?: LoginCallback]) => {
		const loginArgs = args.slice(0, -1) as Parameters<TLoginFunction>;
		const callback = args.slice(-1)[0] as LoginCallback | undefined;

		return login(...loginArgs)
			.catch(async (error: MeteorErrorLike | undefined) => {
				if (!isTotpRequiredError(error)) {
					return Promise.reject(error);
				}

				const { challenge2fa } = await import('./challenge2fa');
				const retryLogin = async (error: TwoFactorErrorResponse & MeteorErrorLike) => {
					const challenge = challenge2fa({
						error,
						errorHandler: () => null,
						emailOrUsername: typeof loginArgs[0] === 'string' ? loginArgs[0] : undefined,
					});

					if (!challenge) {
						throw new Error('Unable to challenge 2fa');
					}

					const [code, resolveChallenge] = challenge;
					const resolvedCode = await code;

					try {
						const result = await loginWithTOTP(...loginArgs, resolvedCode);
						resolveChallenge();
						return result;
					} catch (error) {
						return retryLogin(error as any);
					}
				};

				return retryLogin(error);
			})
			.then((result: unknown) => callback?.(undefined, result))
			.catch((error: MeteorErrorLike | undefined) => {
				if (!isTotpInvalidError(error)) {
					callback?.(error);
					// return;
				}

				// Promise.all([import('../../../app/utils/lib/i18n'), import('../toast')]).then(([{ t }, { dispatchToastMessage }]) => {
				// 	dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
				// 	callback?.(undefined);
				// });
			});
	};
};

export const callLoginMethod = (options: Omit<Accounts.LoginMethodOptions, 'userCallback'>) =>
	new Promise<void>((resolve, reject) => {
		Accounts.callLoginMethod({
			...options,
			userCallback: (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			},
		});
	});
