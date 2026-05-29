import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { clearIntegrationHistoryMethod } from '../functions/clearIntegrationHistory';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		clearIntegrationHistory(integrationId: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async clearIntegrationHistory(integrationId) {
		methodDeprecationLogger.method('clearIntegrationHistory', '9.0.0', '/v1/integrations.history.clear');
		await clearIntegrationHistoryMethod(this.userId, integrationId);
		return true;
	},
});
