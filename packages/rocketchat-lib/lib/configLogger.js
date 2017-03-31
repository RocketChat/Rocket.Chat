/* globals LoggerManager */
RocketChat.settings.get('Log_Package', function(key, value) {
	return (typeof LoggerManager !== 'undefined') && LoggerManager !== null && (LoggerManager.showPackage = value);
});

RocketChat.settings.get('Log_File', function(key, value) {
	return typeof LoggerManager !== 'undefined' && LoggerManager !== null && (LoggerManager.showFileAndLine = value);
});

RocketChat.settings.get('Log_Level', function(key, value) {
	if (value != null) {
		if (typeof LoggerManager !== 'undefined' && LoggerManager !== null) {
			LoggerManager.logLevel = parseInt(value);
		}
		Meteor.setTimeout(() => {
			return typeof LoggerManager !== 'undefined' && LoggerManager !== null && LoggerManager.enable(true);
		}, 200);
	}
});
