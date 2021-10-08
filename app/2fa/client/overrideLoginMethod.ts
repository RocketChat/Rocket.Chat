import toastr from 'toastr';

import { process2faReturn } from './process2faReturn';
import { t } from '../../utils/client';
import { isTotpInvalidError, isTotpRequiredError } from './utils';

type LoginCallback = {
	(error: unknown): void;
	(error: unknown, result: unknown): void;
};

type LoginMethod<A extends unknown[]> = (...args: [...args: A, cb: LoginCallback]) => void;

type LoginMethodWithTotp<A extends unknown[]> = (...args: [...args: A, code: string, cb: LoginCallback]) => void;

export const overrideLoginMethod = <
	A extends unknown[]
>(loginMethod: LoginMethod<A>, loginArgs: A, cb: LoginCallback, loginMethodTOTP: LoginMethodWithTotp<A>, emailOrUsername: string): void => {
	loginMethod.call(null, ...loginArgs, (error: unknown, result?: unknown) => {
		if (!isTotpRequiredError(error)) {
			cb(error);
			return;
		}

		process2faReturn({
			error,
			result,
			emailOrUsername,
			originalCallback: cb,
			onCode: (code: string) => {
				loginMethodTOTP?.call(null, ...loginArgs, code, (error: unknown) => {
					if (isTotpInvalidError(error)) {
						toastr.error(t('Invalid_two_factor_code'));
						cb(null);
						return;
					}

					cb(error);
				});
			},
		});
	});
};
