import type { IFederationServer } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { federationGetServers, federationGetOverviewData } from '../functions/dashboard';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'federation:getServers': () => { data: IFederationServer[] };
		'federation:getOverviewData': () => { data: { title: string; value: number }[] };
	}
}

Meteor.methods<ServerMethods>({
	'federation:getServers': federationGetServers,
	'federation:getOverviewData': federationGetOverviewData,
});
