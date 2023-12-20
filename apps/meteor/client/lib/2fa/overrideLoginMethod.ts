import { t } from '../../../app/utils/lib/i18n';
import { dispatchToastMessage } from '../toast';
import { process2faReturn } from './process2faReturn';
import { isTotpInvalidError, isTotpRequiredError } from './utils';

export type LoginCallback = (error: globalThis.Error | Meteor.Error | Meteor.TypedError | undefined, result?: unknown) => void;

type LoginMethod<TArgs extends any[]> = (...args: [...args: TArgs, cb: LoginCallback]) => void;

type LoginMethodWithTotp<TArgs extends any[]> = (...args: [...args: TArgs, code: string, cb: LoginCallback]) => void;

export const overrideLoginMethod = <TArgs extends any[]>(
	loginMethod: LoginMethod<TArgs>,
	loginArgs: TArgs,
	callback: LoginCallback | undefined,
	loginMethodTOTP: LoginMethodWithTotp<TArgs>,
	emailOrUsername?: string,
): void => {
	loginMethod.call(null, ...loginArgs, async (error: globalThis.Error | Meteor.Error | Meteor.TypedError | undefined, result?: unknown) => {
		if (!isTotpRequiredError(error)) {
			callback?.(error);
			return;
		}

		await process2faReturn({
			error,
			result,
			emailOrUsername,
			originalCallback: callback,
			onCode: (code: string) => {
				loginMethodTOTP?.call(null, ...loginArgs, code, (error: globalThis.Error | Meteor.Error | Meteor.TypedError | undefined) => {
					if (isTotpInvalidError(error)) {
						dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
						callback?.(undefined);
						return;
					}

					callback?.(error);
				});
			},
		});
	});
};
