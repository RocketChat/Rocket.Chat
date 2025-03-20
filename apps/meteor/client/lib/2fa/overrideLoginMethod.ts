import { isTotpInvalidError, isTotpMaxAttemptsError, isTotpRequiredError } from './utils';

type LoginError = globalThis.Error | Meteor.Error | Meteor.TypedError;

export type LoginCallback = (error: LoginError | undefined, result?: unknown) => void;

export const overrideLoginMethod = <TArgs extends any[]>(
	loginMethod: (...args: [...args: TArgs, cb: LoginCallback]) => void,
	loginArgs: TArgs,
	callback: LoginCallback | undefined,
	loginMethodTOTP: (...args: [...args: TArgs, code: string, cb: LoginCallback]) => void,
) => {
	loginMethod(...loginArgs, async (error: LoginError | undefined, result?: unknown) => {
		if (!isTotpRequiredError(error)) {
			callback?.(error);
			return;
		}

		const { process2faReturn } = await import('./process2faReturn');

		await process2faReturn({
			error,
			result,
			emailOrUsername: typeof loginArgs[0] === 'string' ? loginArgs[0] : undefined,
			originalCallback: callback,
			onCode: (code: string) => {
				loginMethodTOTP(...loginArgs, code, (error: LoginError | undefined, result?: unknown) => {
					if (!error) {
						callback?.(undefined, result);
						return;
					}

					if (isTotpInvalidError(error)) {
						callback?.(error);
						return;
					}

					Promise.all([import('../../../app/utils/lib/i18n'), import('../toast')]).then(([{ t }, { dispatchToastMessage }]) => {
						if (isTotpMaxAttemptsError(error)) {
							dispatchToastMessage({
								type: 'error',
								message: t('totp-max-attempts'),
							});
							callback?.(undefined);
							return;
						}

						dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
						callback?.(undefined);
					});
				});
			},
		});
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
			.catch(async (error: LoginError | undefined) => {
				if (!isTotpRequiredError(error)) {
					return Promise.reject(error);
				}

				const { process2faAsyncReturn } = await import('./process2faReturn');
				return process2faAsyncReturn({
					emailOrUsername: typeof loginArgs[0] === 'string' ? loginArgs[0] : undefined,
					error,
					onCode: (code: string) => loginWithTOTP(...loginArgs, code),
				});
			})
			.then((result: unknown) => callback?.(undefined, result))
			.catch((error: LoginError | undefined) => {
				if (!isTotpInvalidError(error)) {
					callback?.(error);
					return;
				}

				Promise.all([import('../../../app/utils/lib/i18n'), import('../toast')]).then(([{ t }, { dispatchToastMessage }]) => {
					dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
					callback?.(undefined);
				});
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
