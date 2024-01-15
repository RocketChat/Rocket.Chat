import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import type { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

import { loginServices } from './loginServices';

type RequestCredentialOptions = Meteor.LoginWithExternalServiceOptions;
type RequestCredentialCallback = (credentialTokenOrError?: string | Error) => void;

type RequestCredentialConfig<T extends Partial<OAuthConfiguration>> = {
	config: T;
	loginStyle: string;
	options: RequestCredentialOptions;
	credentialRequestCompleteCallback?: RequestCredentialCallback;
};

export async function wrapRequestCredentialFn<T extends Partial<OAuthConfiguration>>(
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

	return (
		options?: RequestCredentialOptions | RequestCredentialCallback,
		credentialRequestCompleteCallback?: RequestCredentialCallback,
	) => {
		if (!credentialRequestCompleteCallback && typeof options === 'function') {
			void wrapped({}, options);
			return;
		}

		void wrapped(options as RequestCredentialOptions, credentialRequestCompleteCallback);
	};
}
