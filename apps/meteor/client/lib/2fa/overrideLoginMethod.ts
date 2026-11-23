import type { MeteorErrorLike } from './types';
import { isTotpInvalidError, isTotpMaxAttemptsError, isTotpRequiredError } from './utils';

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

		const { process2faReturn } = await import('./process2faReturn');

		try {
			await process2faReturn({
				error,
				result,
				emailOrUsername: typeof loginArgs[0] === 'string' ? loginArgs[0] : undefined,
				originalCallback: callback,
				onCode: (code: string) => {
					return new Promise<void>((resolve, reject) => {
						loginMethodTOTP(...loginArgs, code, (error: MeteorErrorLike | undefined, result?: unknown) => {
							if (!error) {
								callback?.(undefined, result);
								resolve();
								return;
							}

							if (isTotpInvalidError(error)) {
								reject(error);
								return;
							}

							Promise.all([import('../../../lib/i18n'), import('../toast')]).then(([{ t }, { dispatchToastMessage }]) => {
								if (isTotpMaxAttemptsError(error)) {
									dispatchToastMessage({ type: 'error', message: t('totp-max-attempts') });
									reject(error);
									return;
								}

								dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
								reject(error);
							});
						});
					});
				},
			});
		} catch (error) {
			callback?.(error as MeteorErrorLike);
		}
	});
};

const isLoginCallback = (value: unknown): value is LoginCallback => typeof value === 'function';

export const handleLogin = <TArgs extends [...unknown[], string], TResult>(
	login: (...args: TArgs) => Promise<TResult>,
	loginWithTOTP: (...args: [...TArgs, code: string]) => Promise<TResult>,
) => {
	return (...args: [...loginArgs: TArgs, callback?: LoginCallback]) => {
		const last: unknown = args[args.length - 1];
		const callback = isLoginCallback(last) ? last : undefined;
		const loginArgs = args.slice(0, callback || last === undefined ? -1 : args.length) as TArgs;

		return login(...loginArgs)
			.catch(async (error: MeteorErrorLike | undefined) => {
				if (!isTotpRequiredError(error)) {
					throw error;
				}

				const { process2faAsyncReturn } = await import('./process2faReturn');
				return process2faAsyncReturn({
					emailOrUsername: typeof loginArgs[0] === 'string' ? loginArgs[0] : undefined,
					error,
					onCode: (code: string) => loginWithTOTP(...loginArgs, code),
				});
			})
			.then((result: unknown) => callback?.(undefined, result))
			.catch((error: MeteorErrorLike | undefined) => {
				if (!isTotpInvalidError(error)) {
					callback?.(error);
					return;
				}

				Promise.all([import('../../../lib/i18n'), import('../toast')]).then(([{ t }, { dispatchToastMessage }]) => {
					dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
					callback?.(undefined);
				});
			});
	};
};
