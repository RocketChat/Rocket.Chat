import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { oauth } from '@rocket.chat/ddp-client';
import type { LoginStyle } from '@rocket.chat/ddp-client';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { loginServices } from './loginServices';

type RequestCredentialOptions = Meteor.LoginWithExternalServiceOptions;
type RequestCredentialCallback = (credentialTokenOrError?: string | Error) => void;

type RequestCredentialConfig<T extends Partial<OAuthConfiguration>> = {
	config: T;
	loginStyle: LoginStyle;
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

		const loginStyle = oauth.resolveLoginStyle(config, options, { isCordova: !!Meteor.isCordova });
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
