import { Meteor } from 'meteor/meteor';
import toastr from 'toastr';

import { t } from '../../utils/client';
import { process2faReturn } from './process2faReturn';
import { isTotpInvalidError } from './utils';

const { call } = Meteor;

type Callback = {
	(error: { toastrShowed?: boolean }): void;
	(error: { toastrShowed?: boolean }, result: unknown): void;
};

const callWithTotp = (methodName: string, args: unknown[], callback: Callback) =>
	(twoFactorCode: string, twoFactorMethod: string): unknown =>
		call(methodName, ...args, { twoFactorCode, twoFactorMethod }, (error: { toastrShowed?: boolean }, result: unknown): void => {
			if (isTotpInvalidError(error)) {
				error.toastrShowed = true;
				toastr.error(t('Invalid_two_factor_code'));
				callback(error);
				return;
			}

			callback(error, result);
		});

const callWithoutTotp = (methodName: string, args: unknown[], callback: Callback) =>
	(): unknown =>
		call(methodName, ...args, (error: { toastrShowed?: boolean }, result: unknown): void => {
			process2faReturn({
				error,
				result,
				onCode: callWithTotp(methodName, args, callback),
				originalCallback: callback,
				emailOrUsername: undefined,
			});
		});

Meteor.call = function(methodName: string, ...args: unknown[]): unknown {
	const callback = args.length > 0 && typeof args[args.length - 1] === 'function'
		? args.pop() as Callback
		: (): void => undefined;

	return callWithoutTotp(methodName, args, callback)();
};
