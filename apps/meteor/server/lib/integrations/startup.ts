import type { IOutgoingIntegration } from '@rocket.chat/core-typings';
import { Integrations } from '@rocket.chat/models';

import { triggerHandler } from './lib/triggerHandler';

export const loadOutgoingIntegrations = async (): Promise<void> => {
	await Integrations.find<IOutgoingIntegration>({ type: 'webhook-outgoing' }).forEach((data) =>
		triggerHandler.addIntegration(data as IOutgoingIntegration),
	);
};
