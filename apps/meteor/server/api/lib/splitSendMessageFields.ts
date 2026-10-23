import { chatSendMessageFieldNames } from '@rocket.chat/rest-typings';

const supportedFields = new Set(chatSendMessageFieldNames);

/** Separates the fields a caller may set on a sent message from the fields owned by the server. */
export const splitSendMessageFields = (message: Record<string, unknown>) => {
	const supported: Record<string, unknown> = {};
	const unsupportedNames: string[] = [];

	for (const [name, value] of Object.entries(message)) {
		if (supportedFields.has(name)) {
			supported[name] = value;
		} else {
			unsupportedNames.push(name);
		}
	}

	return { supported, unsupportedNames };
};
