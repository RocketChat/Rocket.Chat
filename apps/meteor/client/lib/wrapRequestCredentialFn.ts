import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import { OAuth } from 'meteor/oauth';

import { loginServices } from './loginServices';
import { type RequestCredentialOptions, type RequestCredentialCallback, wrapLoginHandlerFn } from './wrapLoginHandlerFn';

type RequestCredentialConfig<T extends Partial<OAuthConfiguration>> = {
	config: T;
	loginStyle: string;
	options: RequestCredentialOptions;
	credentialRequestCompleteCallback?: RequestCredentialCallback;
};

export function wrapRequestCredentialFn<T extends Partial<OAuthConfiguration>>(
	serviceName: string,
	fn: (params: RequestCredentialConfig<T>) => void,
) {
	const wrapped = async (
		options: RequestCredentialOptions,
		credentialRequestCompleteCallback?: RequestCredentialCallback,
	): Promise<void> => {
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

	return wrapLoginHandlerFn((...args) => {
		void wrapped(...args);
	});
}
