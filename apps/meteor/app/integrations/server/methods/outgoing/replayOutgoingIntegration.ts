import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../../lib/server/lib/deprecationWarningLogger';
import { replayOutgoingIntegrationMethod } from '../../functions/clearIntegrationHistory';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		replayOutgoingIntegration(params: { integrationId: string; historyId: string }): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async replayOutgoingIntegration({ integrationId, historyId }) {
		methodDeprecationLogger.method('replayOutgoingIntegration', '9.0.0', '/v1/integrations.outgoing.replay');
		await replayOutgoingIntegrationMethod(this.userId, { integrationId, historyId });
		return true;
	},
});
