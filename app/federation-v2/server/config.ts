import { settings } from '../../settings/server';

type bridgeUrlString = `${string}:${string}`;
export type bridgeUrlTuple = [string, number];

interface IBridgeConfig {
	id: string;
	hsToken: string;
	asToken: string;
	homeserverUrl: string;
	homeserverDomain: string;
	bridgeUrl: bridgeUrlString;
	bridgeLocalpart: string;
}

export const config: IBridgeConfig = {
	id: settings.get('FederationV2_id') as string,
	hsToken: settings.get('FederationV2_hs_token') as string,
	asToken: settings.get('FederationV2_as_token') as string,
	homeserverUrl: settings.get('FederationV2_homeserver_url') as string,
	homeserverDomain: settings.get('FederationV2_homeserver_domain') as string,
	bridgeUrl: settings.get('FederationV2_bridge_url') as bridgeUrlString,
	bridgeLocalpart: settings.get('FederationV2_bridge_localpart') as string,
};
