import type { INewOutgoingIntegration, IOutgoingIntegration } from '@rocket.chat/core-typings';
import { Integrations } from '@rocket.chat/models';
import { removeEmpty } from '@rocket.chat/tools';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../lib/authorization/hasPermission';
import { validateOutgoingIntegration } from '../../../lib/integrations/lib/validateOutgoingIntegration';
import { validateScriptEngine } from '../../../lib/integrations/lib/validateScriptEngine';
import { notifyOnIntegrationChanged } from '../../../lib/notifyListener';

export const addOutgoingIntegration = async (userId: string, integration: INewOutgoingIntegration): Promise<IOutgoingIntegration> => {
	check(
		integration,
		Match.ObjectIncluding({
			type: String,
			name: String,
			enabled: Boolean,
			username: String,
			channel: String,
			alias: Match.Maybe(String),
			emoji: Match.Maybe(String),
			scriptEnabled: Boolean,
			script: Match.Maybe(String),
			scriptEngine: Match.Maybe(String),
			urls: Match.Maybe([String]),
			event: Match.Maybe(String),
			triggerWords: Match.Maybe([String]),
			avatar: Match.Maybe(String),
			token: Match.Maybe(String),
			impersonateUser: Match.Maybe(Boolean),
			retryCount: Match.Maybe(Number),
			retryDelay: Match.Maybe(String),
			retryFailedCalls: Match.Maybe(Boolean),
			runOnEdits: Match.Maybe(Boolean),
			targetRoom: Match.Maybe(String),
			triggerWordAnywhere: Match.Maybe(Boolean),
		}),
	);

	if (
		!userId ||
		(!(await hasPermissionAsync(userId, 'manage-outgoing-integrations')) &&
			!(await hasPermissionAsync(userId, 'manage-own-outgoing-integrations')))
	) {
		throw new Meteor.Error('not_authorized');
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
