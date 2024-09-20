import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Integrations } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { notifyOnIntegrationChangedById } from '../../../../lib/server/lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteIncomingIntegration(integrationId: string): Promise<boolean>;
	}
}

export const deleteIncomingIntegration = async (integrationId: string, userId: string): Promise<void> => {
	let integration;

	if (userId && (await hasPermissionAsync(userId, 'manage-incoming-integrations'))) {
		integration = Integrations.findOneById(integrationId);
	} else if (userId && (await hasPermissionAsync(userId, 'manage-own-incoming-integrations'))) {
		integration = Integrations.findOne({
			'_id': integrationId,
			'_createdBy._id': userId,
		});
	} else {
		throw new Meteor.Error('not_authorized', 'Unauthorized', {
			method: 'deleteIncomingIntegration',
		});
	}

	if (!(await integration)) {
		throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
			method: 'deleteIncomingIntegration',
		});
	}

	await Integrations.removeById(integrationId);
	void notifyOnIntegrationChangedById(integrationId, 'removed');
};

Meteor.methods<ServerMethods>({
	async deleteIncomingIntegration(integrationId) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('not_authorized', 'Unauthorized', {
				method: 'deleteIncomingIntegration',
			});
		}

		await deleteIncomingIntegration(integrationId, userId);

		return true;
	},
});
