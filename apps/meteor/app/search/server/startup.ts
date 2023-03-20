import { Meteor } from 'meteor/meteor';

import { searchProviderService } from './service';

Meteor.startup(() => {
	searchProviderService.start();
});
