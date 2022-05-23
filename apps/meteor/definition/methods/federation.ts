import type { IFederationServer } from '@rocket.chat/core-typings';
import '@rocket.chat/ui-contexts';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface ServerMethods {
		'federation:getServers': (...args: any[]) => { value: { data: IFederationServer[] } };
		'federation:getOverviewData': (...args: any[]) => (...args: any[]) => { value: { data: IFederationServer[] } };
	}
}
