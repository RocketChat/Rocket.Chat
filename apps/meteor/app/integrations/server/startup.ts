import { Meteor } from 'meteor/meteor';
import { Integrations } from '@rocket.chat/models';

import { triggerHandler } from './lib/triggerHandler';

Meteor.startup(async function () {
	await Integrations.find({ type: 'webhook-outgoing' }).forEach((data) => triggerHandler.addIntegration(data));
});
