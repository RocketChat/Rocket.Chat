let logger;

if (Meteor.isServer) {
	logger = new Logger('TemplateVarHandler', {});
}

RocketChat.templateVarHandler = function(variable, object) {

	const templateRegex = /#{([\w\-]+)}/gi;
	let match = templateRegex.exec(variable);
	let tmpVariable = variable;

	if (match == null) {
		if (!object.hasOwnProperty(variable)) {
			logger && logger.debug(`user does not have attribute: ${ variable }`);
			return;
		}
		return object[variable];
	} else {
		logger && logger.debug('template found. replacing values');
		while (match != null) {
			const tmplVar = match[0];
			const tmplAttrName = match[1];

			if (!object.hasOwnProperty(tmplAttrName)) {
				logger && logger.debug(`user does not have attribute: ${ tmplAttrName }`);
				return;
			}

			const attrVal = object[tmplAttrName];
			logger && logger.debug(`replacing template var: ${ tmplVar } with value: ${ attrVal }`);
			tmpVariable = tmpVariable.replace(tmplVar, attrVal);
			match = templateRegex.exec(variable);
		}
		return tmpVariable;
	}
};
