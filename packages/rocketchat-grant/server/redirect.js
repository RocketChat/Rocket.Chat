import { authenticate } from './authenticate';
import Settings from './settings';
import { routes } from './routes';
import { GrantError } from './error';

function parseUrl(url, config) {
	return url.replace(/\{[\ ]*(provider|accessToken|refreshToken|error)[\ ]*\}/g, (_, key) => config[key]);
}

function getAppConfig(providerName, appName) {
	const providerConfig = Settings.get(providerName);

	if (providerConfig) {
		return Settings.apps.get(appName);
	}
}

export async function middleware(req, res, next) {
	const route = routes.appCallback(req);

	// handle app callback
	if (route) {
		const config = {
			provider: route.provider
		};
		const appConfig = getAppConfig(route.provider, route.app);

		if (appConfig) {
			const {
				redirectUrl,
				errorUrl
			} = appConfig;

			try {
				const tokens = await authenticate(route.provider, req);

				config.accessToken = tokens.accessToken;
				config.refreshToken = tokens.refreshToken;

				res.redirect(parseUrl(redirectUrl, config));
				return;
			} catch (error) {
				config.error = error instanceof GrantError ? error.message : 'Something went wrong';

				console.error(error);

				res.redirect(parseUrl(errorUrl, config));
				return;
			}
		}
	}

	next();
}
