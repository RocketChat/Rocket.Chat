import { Meteor } from 'meteor/meteor';

import { searchProviderService } from './service';

Meteor.startup(async () => {
	await searchProviderService.start();
});
