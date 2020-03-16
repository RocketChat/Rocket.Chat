import path from 'path';

import { Meteor } from 'meteor/meteor';

function updateLoggingLevel(logLevel) {
	switch (logLevel) {
		case '0':
		case 0:
			return 'warn';
		case '1':
		case 1:
			return 'info';
		case '2':
		case 2:
			return 'debug';
		default:
			return 'error';
	}// switch
}

function _initLogging2file() {
	if (Meteor.logging2fileLogger) {
		return;
	}

	const loggingFile = process.env.LOGGING_FILE;
	const port = process.env.PORT;
	if (loggingFile && port) {
		const dirName = path.dirname(loggingFile);
		const extName = path.extname(loggingFile);
		const baseName = path.basename(loggingFile, extName);
		const filePath = path.join(dirName, `${ baseName }-${ port }${ extName }`);
		const logger2 = require('logging2file').createLogger(filePath);
		logger2.reloadLogOnPm2Action();
		logger2.truncateLogOnPm2Action();
		logger2.useLogging2File = !!process.env.USE_LOGGING2FILE;
		Meteor.logging2fileLogger = logger2;
		console.log(`Open logging file of "${ filePath }"`);
		if (logger2.useLogging2File) {
			console.warn(`Logging messages into file of "${ filePath }"`);
		}
	}
}

function checkLogging() {
	return Meteor.logging2fileLogger && Meteor.logging2fileLogger.useLogging2File;
}

function logging(...all) {
	Meteor.logging2fileLogger.log2(null, ...all);
}
function loggingWithPrefix(prefix, ...all) {
	Meteor.logging2fileLogger.log2(prefix, ...all);
}

export {
	updateLoggingLevel,
	checkLogging,
	loggingWithPrefix,
	logging,
};

Meteor.startup(() => {
	_initLogging2file();
});
