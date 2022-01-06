import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';

// The code on this file was copied directly from Meteor and modified to support mobile google oauth
// https://github.com/meteor/meteor/blob/ffcfa5062cf1bf8a64ea64fef681ffcd99fe7939/packages/oauth/oauth_server.js

Meteor.startup(() => {
	const appRedirectUrl = 'rocketchat://auth';

	const renderEndOfLoginResponse = (options) => {
		const escape = (s) => {
			if (!s) {
				return s;
			}

			return s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/\'/g, '&quot;')
				.replace(/\'/g, '&#x27;')
				.replace(/\//g, '&#x2F;');
		};

		const config = {
			setCredentialToken: !!options.setCredentialToken,
			credentialToken: escape(options.credentialToken),
			credentialSecret: escape(options.credentialSecret),
			storagePrefix: escape(OAuth._storageTokenPrefix),
			redirectUrl: escape(options.redirectUrl),
			isCordova: Boolean(options.isCordova),
		};

		let template;
		if (options.loginStyle === 'popup') {
			template = OAuth._endOfPopupResponseTemplate;
		} else if (options.loginStyle === 'redirect') {
			template = OAuth._endOfRedirectResponseTemplate;
		} else {
			throw new Error(`invalid loginStyle: ${options.loginStyle}`);
		}

		const result = template
			.replace(/##CONFIG##/, JSON.stringify(config))
			.replace(/##ROOT_URL_PATH_PREFIX##/, __meteor_runtime_config__.ROOT_URL_PATH_PREFIX);

		return `<!DOCTYPE html>\n${result}`;
	};

	OAuth._endOfLoginResponse = (res, details) => {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		let redirectUrl;

		if (details.loginStyle === 'redirect') {
			redirectUrl = OAuth._stateFromQuery(details.query).redirectUrl;
			const appHost = Meteor.absoluteUrl();

			if (redirectUrl.startsWith(appRedirectUrl)) {
				redirectUrl = `${appRedirectUrl}?host=${appHost}&type=oauth`;

				if (details.error) {
					const error = encodeURIComponent(details.error.toString());
					redirectUrl = `${redirectUrl}&error=${error}`;
				}

				if (details.credentials) {
					const { token, secret } = details.credentials;
					redirectUrl = `${redirectUrl}&credentialToken=${token}&credentialSecret=${secret}`;
				}
			} else if (!Meteor.settings?.packages?.oauth?.disableCheckRedirectUrlOrigin && OAuth._checkRedirectUrlOrigin(redirectUrl)) {
				details.error = `redirectUrl (${redirectUrl}) is not on the same host as the app (${appHost})`;
				redirectUrl = appHost;
			}
		}

		const isCordova = OAuth._isCordovaFromQuery(details.query);

		if (details.error) {
			res.end(
				renderEndOfLoginResponse({
					loginStyle: details.loginStyle,
					setCredentialToken: false,
					redirectUrl,
					isCordova,
				}),
				'utf-8',
			);
			return;
		}

		// If we have a credentialSecret, report it back to the parent
		// window, with the corresponding credentialToken. The parent window
		// uses the credentialToken and credentialSecret to log in over DDP.
		res.end(
			renderEndOfLoginResponse({
				loginStyle: details.loginStyle,
				setCredentialToken: true,
				credentialToken: details.credentials.token,
				credentialSecret: details.credentials.secret,
				redirectUrl,
				isCordova,
			}),
			'utf-8',
		);
	};
});
