import { Integrations } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

const hasIntegrationsPermission = async (userId, integration) => {
	if (!integration) {
		throw new Error('integration is required');
	}
	return integration.type === 'webhook-incoming'
		? hasPermissionAsync(userId, 'manage-incoming-integrations') || (userId === integration._createdBy._id && hasPermissionAsync(userId, 'manage-own-incoming-integrations'))
		: hasPermissionAsync(userId, 'manage-outgoing-integrations') || (userId === integration._createdBy._id && hasPermissionAsync(userId, 'manage-own-outgoing-integrations'));
};

export const findOneIntegration = async ({ userId, integrationId, createdBy }) => {
	const integration = await Integrations.findOneByIdAndCreatedByIfExists({ _id: integrationId, createdBy });
	if (!integration) {
		throw new Error('The integration does not exists.');
	}
	if (!await hasIntegrationsPermission(userId, integration)) {
		throw new Error('not-authorized');
	}
	return integration;
};
