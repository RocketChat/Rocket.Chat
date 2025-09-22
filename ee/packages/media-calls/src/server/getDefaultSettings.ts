import type { IMediaCallServerSettings } from '../definition/IMediaCallServer';

export function getDefaultSettings(): IMediaCallServerSettings {
	return {
		enabled: false,
		internalCalls: {
			requireExtensions: false,
			routeExternally: 'never',
		},
		sip: {
			enabled: false,
		},
	};
}
