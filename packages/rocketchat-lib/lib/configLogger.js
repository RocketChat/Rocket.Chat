/* globals LoggerManager */
function log(fn = () => {}) {
	return typeof LoggerManager !== 'undefined' && fn(LoggerManager);
}

RocketChat.settings.get('Log_Package', function(key, value) {
	return log(LoggerManager => LoggerManager.showPackage = value);
});

RocketChat.settings.get('Log_File', function(key, value) {
	return log(LoggerManager => LoggerManager.showFileAndLine = value);
});

RocketChat.settings.get('Log_Level', function(key, value) {
	if (value != null) {
		log(LoggerManager => LoggerManager.logLevel = parseInt(value));
		Meteor.setTimeout(() => {
			return log(LoggerManager => LoggerManager.enable(true));
		}, 200);
	}
});
