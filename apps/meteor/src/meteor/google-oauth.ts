import { OAuth } from './oauth.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { ServiceConfiguration } from './service-configuration.ts';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type GoogleOptions = {
	requestPermissions?: string[];
	loginUrlParameters?: Record<string, string>;
	requestOfflineToken?: boolean;
	forceApprovalPrompt?: boolean;
	prompt?: string;
	loginHint?: string;
	loginStyle?: 'popup' | 'redirect';
	redirectUrl?: string;
	[key: string]: any;
};

type CredentialRequestCompleteCallback = (error?: Error | unknown) => void;

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const ILLEGAL_PARAMETERS: Record<string, boolean> = {
	response_type: true,
	client_id: true,
	scope: true,
	redirect_uri: true,
	state: true,
};

// -----------------------------------------------------------------------------
// Google OAuth Implementation
// -----------------------------------------------------------------------------

export const Google = {
	requestCredential(
		options?: GoogleOptions | CredentialRequestCompleteCallback,
		credentialRequestCompleteCallback?: CredentialRequestCompleteCallback,
	) {
		// Support (callback) signature without options
		if (!credentialRequestCompleteCallback && typeof options === 'function') {
			credentialRequestCompleteCallback = options;
			options = {};
		} else if (!options) {
			options = {};
		}

		const opts = options as GoogleOptions;

		const config = ServiceConfiguration.configurations.findOne({ service: 'google' }) as GoogleOptions | undefined;

		if (!config) {
			if (credentialRequestCompleteCallback) {
				credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());
			}
			return;
		}

		const credentialToken = Random.secret();

		// Manage Scopes: Ensure 'email' is always present and remove duplicates
		const scopeSet = new Set<string>(opts.requestPermissions || ['profile']);
		scopeSet.add('email');
		const scopes = Array.from(scopeSet);

		// Merge Login URL Parameters (Config > Options)
		const loginUrlParameters: Record<string, string> = {
			...(config.loginUrlParameters || {}),
			...(opts.loginUrlParameters || {}),
		};

		// Validate Parameters
		Object.keys(loginUrlParameters).forEach((key) => {
			if (ILLEGAL_PARAMETERS[key]) {
				throw new Error(`Google.requestCredential: Invalid loginUrlParameter: ${key}`);
			}
		});

		// Handle specific Google OAuth flags
		if (opts.requestOfflineToken != null) {
			loginUrlParameters.access_type = opts.requestOfflineToken ? 'offline' : 'online';
		}

		if (opts.prompt != null) {
			loginUrlParameters.prompt = opts.prompt;
		} else if (opts.forceApprovalPrompt) {
			loginUrlParameters.prompt = 'consent';
		}

		if (opts.loginHint) {
			loginUrlParameters.login_hint = opts.loginHint;
		}

		const loginStyle = OAuth._loginStyle('google', config, opts);

		// Add mandatory protocol parameters
		Object.assign(loginUrlParameters, {
			response_type: 'code',
			client_id: config.clientId,
			scope: scopes.join(' '),
			redirect_uri: OAuth._redirectUri('google', config),
			state: OAuth._stateParam(loginStyle, credentialToken, opts.redirectUrl),
		});

		// Construct Query String
		const queryString = Object.keys(loginUrlParameters)
			.map((param) => `${encodeURIComponent(param)}=${encodeURIComponent(loginUrlParameters[param])}`)
			.join('&');

		const loginUrl = `https://accounts.google.com/o/oauth2/auth?${queryString}`;

		OAuth.launchLogin({
			loginService: 'google',
			loginStyle,
			loginUrl,
			credentialRequestCompleteCallback,
			credentialToken,
			popupOptions: { height: 600 },
		});
	},
};

// -----------------------------------------------------------------------------
// Legacy Registration
// -----------------------------------------------------------------------------

Package['google-oauth'] = { Google };
