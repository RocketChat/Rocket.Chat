import type { IFederationServer } from '@rocket.chat/core-typings';
import '@rocket.chat/ui-contexts';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'federation:getServers': () => { data: IFederationServer[] };
		'federation:getOverviewData': () => { data: { title: string; value: number }[] };
	}
}
