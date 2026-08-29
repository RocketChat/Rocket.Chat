import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import type { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { loginServices } from './loginServices';
import type { LoginWithExternalServiceOptions } from '../definitions/IOAuthProvider';

type RequestCredentialCallback = (credentialTokenOrError?: string | globalThis.Error | Meteor.Error | Meteor.TypedError) => void;

type RequestCredentialConfig<
	T extends Partial<OAuthConfiguration>,
	TOptions extends LoginWithExternalServiceOptions = LoginWithExternalServiceOptions,
> = {
	config: T;
	loginStyle: string;
	options: TOptions;
	credentialRequestCompleteCallback?: RequestCredentialCallback;
};

export function wrapRequestCredentialFn<
	T extends Partial<OAuthConfiguration>,
	TOptions extends LoginWithExternalServiceOptions = LoginWithExternalServiceOptions,
>(serviceName: string, fn: (params: RequestCredentialConfig<T, TOptions>) => void) {
	const wrapped = async (options: TOptions, credentialRequestCompleteCallback?: RequestCredentialCallback): Promise<void> => {
		const config = await loginServices.loadLoginService<T>(serviceName);
		if (!config) {
			credentialRequestCompleteCallback?.(new Accounts.ConfigError());
			return;
		}

		const loginStyle = OAuth._loginStyle(serviceName, config, options);
		fn({
			config,
			loginStyle,
			options,
			credentialRequestCompleteCallback,
		});
	};

	return (options?: TOptions | RequestCredentialCallback, credentialRequestCompleteCallback?: RequestCredentialCallback) => {
		if (!credentialRequestCompleteCallback && typeof options === 'function') {
			void wrapped({} as TOptions, options);
			return;
		}

		void wrapped(options as TOptions, credentialRequestCompleteCallback);
	};
}
