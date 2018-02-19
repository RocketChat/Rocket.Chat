export const path = '/_oauth_apps';

export function generateCallback(providerName) {
	return `${ path }/${ providerName }/callback`;
}

export function generateAppCallback(providerName, appName) {
	return generateCallback(`${ providerName }/${ appName }`);
}

export function getPaths(req) {
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
		return splitPath.slice(2);
	}
}

export const routes = {
	// :path/:provider/:app/callback
	appCallback: (req) => {
		const paths = getPaths(req);

		if (paths && paths[2] === 'callback') {
			return {
				provider: paths[0],
				app: paths[1]
			};
		}
	},
	// :path/providers
	providers: (req) => {
		const paths = getPaths(req);

		return paths && paths[0] === 'providers';
	}
};
