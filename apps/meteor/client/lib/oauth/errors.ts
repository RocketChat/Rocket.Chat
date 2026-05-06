// Mirrors `Accounts.ConfigError` from meteor/accounts-base — thrown when an
// OAuth provider's `loginServiceConfiguration` document hasn't been loaded
// yet. Callers thread this through `credentialRequestCompleteCallback` so
// the login UI can surface it.
export class OAuthConfigError extends Error {
	public readonly error = 'Accounts.ConfigError';

	constructor(message = 'Configuration not found') {
		super(message);
		this.name = 'Accounts.ConfigError';
	}
}
