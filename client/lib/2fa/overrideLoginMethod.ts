import { t } from '../../../app/utils/client';
import { dispatchToastMessage } from '../toast';
import { process2faReturn } from './process2faReturn';
import { isTotpInvalidError, isTotpRequiredError } from './utils';

type LoginCallback = {
	(error: unknown): void;
	(error: unknown, result: unknown): void;
};

type LoginMethod<A extends unknown[]> = (...args: [...args: A, cb: LoginCallback]) => void;

type LoginMethodWithTotp<A extends unknown[]> = (...args: [...args: A, code: string, cb: LoginCallback]) => void;

export const overrideLoginMethod = <A extends unknown[]>(
	loginMethod: LoginMethod<A>,
	loginArgs: A,
	callback: LoginCallback,
	loginMethodTOTP: LoginMethodWithTotp<A>,
	emailOrUsername: string,
): void => {
	loginMethod.call(null, ...loginArgs, (error: unknown, result?: unknown) => {
		if (!isTotpRequiredError(error)) {
			callback(error);
			return;
		}

		process2faReturn({
			error,
			result,
			emailOrUsername,
			originalCallback: callback,
			onCode: (code: string) => {
				loginMethodTOTP?.call(null, ...loginArgs, code, (error: unknown) => {
					if (isTotpInvalidError(error)) {
						dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
						callback(null);
						return;
					}

					callback(error);
				});
			},
		});
	});
};
