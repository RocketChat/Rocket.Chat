import { Logger } from '@rocket.chat/logger';

const logger = new Logger('TemplateVarHandler');

export const templateVarHandler = function (variable: string, object: Record<string, any>): string | undefined {
	const templateRegex = /#{([\w\-]+)}/gi;
	let match = templateRegex.exec(variable);
	let tmpVariable = variable;

	if (match == null) {
		if (!object.hasOwnProperty(variable)) {
			logger?.debug({ msg: 'User does not have attribute', attribute: variable });
			return;
		}
		return object[variable];
	}
	logger?.debug('template found. replacing values');
	while (match != null) {
		const tmplVar = match[0];
		const tmplAttrName = match[1];

		if (!object.hasOwnProperty(tmplAttrName)) {
			logger?.debug({ msg: 'User does not have attribute', attribute: tmplAttrName });
			return;
		}

		const attrVal = object[tmplAttrName];
		logger?.debug({ msg: 'Replacing template var', templateVar: tmplVar, value: attrVal });
		tmpVariable = tmpVariable.replace(tmplVar, attrVal);
		match = templateRegex.exec(variable);
	}
	return tmpVariable;
};
