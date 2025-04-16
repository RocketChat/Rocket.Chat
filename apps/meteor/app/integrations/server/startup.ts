import { Integrations } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { triggerHandler } from './lib/triggerHandler';
import { IOutgoingIntegration } from '@rocket.chat/core-typings';

Meteor.startup(async () => {
	await Integrations.find<IOutgoingIntegration>({ type: 'webhook-outgoing' }).forEach((data) => triggerHandler.addIntegration(data as IOutgoingIntegration));
});
