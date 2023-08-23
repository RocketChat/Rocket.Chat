import { Integrations } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { triggerHandler } from './lib/triggerHandler';

Meteor.startup(async () => {
	await Integrations.find({ type: 'webhook-outgoing' }).forEach((data) => triggerHandler.addIntegration(data));
});
