import { settings } from '@rocket.chat/settings';

import { API } from '../../../../app/api/server';

// Well-known endpoints for Matrix federation discovery
API.v1.addRoute(
	'.well-known/matrix/server',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async get() {
			const domain = settings.get('NativeFederation_Domain') || 'localhost';
			const port = settings.get('NativeFederation_Port') || 8448;

			return API.v1.success({
				'm.server': `${domain}:${port}`,
			});
		},
	},
);

API.v1.addRoute(
	'.well-known/matrix/client',
	{
		authRequired: false,
		license: ['federation'],
	},
	{
		async get() {
			const domain = settings.get('NativeFederation_Domain') || 'localhost';
			const port = settings.get('NativeFederation_Port') || 8448;

			return API.v1.success({
				'm.homeserver': {
					base_url: `https://${domain}:${port}`,
				},
				'm.identity_server': {
					base_url: `https://${domain}:${port}`,
				},
			});
		},
	},
);