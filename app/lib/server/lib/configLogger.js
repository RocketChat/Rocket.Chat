import { Meteor } from 'meteor/meteor';

import { LoggerManager } from '../../../logger/server/server';
import { settings } from '../../../settings/server';

settings.get('Log_Package', function(key, value) {
	LoggerManager.showPackage = value;
});

settings.get('Log_File', function(key, value) {
	LoggerManager.showFileAndLine = value;
});

settings.get('Log_Level', function(key, value) {
	if (value != null) {
		LoggerManager.logLevel = parseInt(value);
		Meteor.setTimeout(() => LoggerManager.enable(true), 200);
	}
});
