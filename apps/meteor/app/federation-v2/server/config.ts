import { settings } from '../../settings/server';

type bridgeUrlString = `${string}://${string}:${string}`;
export type bridgeUrlTuple = [string, string, number];

interface IBridgeConfig {
	id: string;
	hsToken: string;
	asToken: string;
	homeserverUrl: string;
	homeserverDomain: string;
	bridgeUrl: bridgeUrlString;
	bridgeLocalpart: string;
}

function _getConfig(): IBridgeConfig {
	return {
		id: settings.get('Federation_Matrix_id') as string,
		hsToken: settings.get('Federation_Matrix_hs_token') as string,
		asToken: settings.get('Federation_Matrix_as_token') as string,
		homeserverUrl: settings.get('Federation_Matrix_homeserver_url') as string,
		homeserverDomain: settings.get('Federation_Matrix_homeserver_domain') as string,
		bridgeUrl: settings.get('Federation_Matrix_bridge_url') as bridgeUrlString,
		bridgeLocalpart: settings.get('Federation_Matrix_bridge_localpart') as string,
	} as IBridgeConfig;
}

export let config: IBridgeConfig = _getConfig();

export function getConfig() {
	config = _getConfig();
}
