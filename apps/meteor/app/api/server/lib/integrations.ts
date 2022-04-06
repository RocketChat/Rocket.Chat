import { Integrations } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import type { IIntegration } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';

const hasIntegrationsPermission = async (userId: string, integration: IIntegration): Promise<boolean> => {
	const type = integration.type === 'webhook-incoming' ? 'incoming' : 'outgoing';

	if (await hasPermissionAsync(userId, `manage-${type}-integrations`)) {
		return true;
	}

	if (userId === integration._createdBy._id) {
		return hasPermissionAsync(userId, `manage-own-${type}-integrations`);
	}

	return false;
};

export const findOneIntegration = async ({
	userId,
	integrationId,
	createdBy,
}: {
	userId: string;
	integrationId: string;
	createdBy: IUser;
}): Promise<IIntegration> => {
	const integration = await Integrations.findOneByIdAndCreatedByIfExists({
		_id: integrationId,
		createdBy,
	});
	if (!integration) {
		throw new Error('The integration does not exists.');
	}
	if (!(await hasIntegrationsPermission(userId, integration))) {
		throw new Error('not-authorized');
	}
	return integration;
};
