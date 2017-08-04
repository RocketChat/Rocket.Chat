export const path = '/_oauth_apps';

function generateCallback(serviceName) {
	return `${ path }/${ serviceName }/callback`;
}

function generateAppCallback(serviceName, appName) {
	return generateCallback(`${ serviceName }/${ appName }`);
}

function addProviders(config) {
	const services = RocketChat.settings.get(/^(Accounts_OAuth_)[a-z0-9_]+$/i);

	services.forEach((service) => {
		let serviceName = service.key.replace('Accounts_OAuth_', '').toLowerCase();

		if (serviceName === 'meteor') {
			serviceName = 'meteor-developer';
		}

		if (service.value === true) {
			// TODO: scope
			const data = {
				key: RocketChat.settings.get(`${ service.key }_id`),
				secret: RocketChat.settings.get(`${ service.key }_secret`),
				callback: generateCallback(serviceName)
			};

			// TODO: create a space to set up OAuth services
			if (serviceName === 'github') {
				data.key = '96db2753350cfe8c8ae1';
				data.secret = '546317a561df5e3d350fca9b5500f270b54f3301';

				console.log('PWA for GitHub');

				// TODO: create a space to define Apps
				data['pwa'] = {
					callback: generateAppCallback(serviceName, 'pwa')
				};
			}

			config[serviceName] = data;
		}
	});

	return config;
}

export function generateConfig() {
	const config = {
		server: {
			protocol: 'http',
			host: RocketChat.hostname,
			path,
			state: true
		}
	};

	addProviders(config);

	return config;
}
