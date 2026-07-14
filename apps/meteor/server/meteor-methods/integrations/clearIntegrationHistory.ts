import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../app/lib/server/lib/deprecationWarningLogger';
import { clearIntegrationHistoryMethod } from '../../lib/integrations/functions/clearIntegrationHistory';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		clearIntegrationHistory(integrationId: string): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async clearIntegrationHistory(integrationId) {
		methodDeprecationLogger.method('clearIntegrationHistory', '9.0.0', '/v1/integrations.clearHistory');
		if (!this.userId) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', { method: 'clearIntegrationHistory' });
		}
		await clearIntegrationHistoryMethod(this.userId, integrationId);
		return true;
	},
});
