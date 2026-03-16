import type { IMediaCallServerSettings } from '../definition/IMediaCallServer';

export function getDefaultSettings(): IMediaCallServerSettings {
	return {
		internalCalls: {
			requireExtensions: false,
			routeExternally: 'never',
		},
		sip: {
			enabled: false,
			drachtio: {
				host: '',
				port: 9022,
				secret: '',
			},
			sipServer: {
				host: '',
				port: 5080,
			},
		},

		permissionCheck: async () => false,
	};
}
