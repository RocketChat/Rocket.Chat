import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../../../logger';

Meteor.startup(function() {
	return SystemLogger.info('Environment variables', JSON.stringify(process.env, '', 2));
});
