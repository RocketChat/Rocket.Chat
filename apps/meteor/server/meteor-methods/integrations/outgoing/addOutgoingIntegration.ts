import { ClientSafeError } from '@rocket.chat/core-services';
import type { INewOutgoingIntegration, IOutgoingIntegration } from '@rocket.chat/core-typings';
import { Integrations } from '@rocket.chat/models';
import { removeEmpty } from '@rocket.chat/tools';

import { hasPermissionAsync } from '../../../lib/authorization/hasPermission';
import { validateOutgoingIntegration } from '../../../lib/integrations/lib/validateOutgoingIntegration';
import { validateScriptEngine } from '../../../lib/integrations/lib/validateScriptEngine';
import { notifyOnIntegrationChanged } from '../../../lib/notifyListener';

export const addOutgoingIntegration = async (userId: string, integration: INewOutgoingIntegration): Promise<IOutgoingIntegration> => {
	if (
		!userId ||
		(!(await hasPermissionAsync(userId, 'manage-outgoing-integrations')) &&
			!(await hasPermissionAsync(userId, 'manage-own-outgoing-integrations')))
	) {
		throw new ClientSafeError('not_authorized');
	}

	if (integration.script?.trim()) {
		validateScriptEngine(integration.scriptEngine ?? 'isolated-vm');
	}

	const integrationData = await validateOutgoingIntegration(integration, userId);

	const { insertedId } = await Integrations.insertOne(removeEmpty(integrationData));

	const integrationStored = await Integrations.findOne({ _id: insertedId });

	if (!integrationStored) {
		throw new Error('Error inserting integration');
	}

	void notifyOnIntegrationChanged({ ...integrationStored, _id: insertedId }, 'inserted');

	return integrationStored as IOutgoingIntegration;
};
