/* globals LoggerManager */
RocketChat.settings.get('Log_Package', function(key, value) {
	return LoggerManager.showPackage = value;
});

RocketChat.settings.get('Log_File', function(key, value) {
	return LoggerManager.showFileAndLine = value;
});

RocketChat.settings.get('Log_Level', function(key, value) {
	if (value != null) {
		LoggerManager.logLevel = parseInt(value);
		Meteor.setTimeout(() => {
			return LoggerManager.enable(true);
		}, 200);
	}
});
