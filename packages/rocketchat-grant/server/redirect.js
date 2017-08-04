function getEntry(req) {
	let provider;
	let app;

	const i = req.url.indexOf('?');
	let barePath;

	if (i === -1) {
		barePath = req.url;
	} else {
		barePath = req.url.substring(0, i);
	}

	const splitPath = barePath.split('/');

	// Any non-oauth request will continue down the default
	// middlewares.
	if (splitPath[1] === '_oauth_apps') {
		provider = splitPath[2];
		app = splitPath && splitPath[3] !== 'callback' ? splitPath[3] : null;
	}

	return {
		provider,
		app
	};
}

function getAccessToken(req) {
	const i = req.url.indexOf('?');

	if (i === -1) {
		return;
	}

	const barePath = req.url.substring(i + 1);
	const splitPath = barePath.split('&');
	const token = splitPath.find(p => p.match(/access_token=[a-zA-Z0-9]+/));

	if (token) {
		return token.replace('access_token=', '');
	}
}

export function middleware(req, res, next) {
	const {
		provider,
		app
	} = getEntry(req);

	if (!provider || !app) {
		next();
		return;
	}

	console.log('provider', provider);
	console.log('app', app);

	// handle providers and apps
	if (provider === 'github' && app === 'pwa') {
		const token = getAccessToken(req);
		console.log('token', token);

		// TODO: get redirect URL from settings
		const redirectUrl = 'http://localhost:4200/login';

		res.redirect(`${ redirectUrl }?service=${ provider }&access_token=${ token }`);
	}

	next();
}
