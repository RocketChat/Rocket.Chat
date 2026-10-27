import { isObject, objectMap } from '@rocket.chat/tools';

import { t } from '../../lib/i18n';

const hasProperty = <TProperty extends number | string | symbol>(
	obj: unknown,
	property: TProperty,
): obj is { [key in TProperty]: unknown } => isObject(obj) && property in obj;

const hasXHR = (
	error: object,
): error is {
	xhr: {
		responseJSON: {
			error: string;
			status: string;
			messages: string[];
			payload?: any;
		};
	};
} => hasProperty(error, 'xhr') && hasProperty(error.xhr, 'responseJSON');

export function getErrorMessage(error: unknown, defaultMessage?: string): string {
	if (typeof error === 'string') {
		return t(error);
	}

	if (!isObject(error)) {
		if (defaultMessage) return getErrorMessage(defaultMessage);

		throw new TypeError('no default error message specified');
	}

	if (hasXHR(error)) {
		return getErrorMessage(error.xhr.responseJSON, defaultMessage);
	}

	const message =
		(hasProperty(error, 'reason') && typeof error.reason === 'string' ? error.reason : undefined) ??
		(hasProperty(error, 'error') && typeof error.error === 'string' ? error.error : undefined) ??
		(hasProperty(error, 'message') && typeof error.message === 'string' ? error.message : undefined) ??
		defaultMessage;
	const details = hasProperty(error, 'details') && isObject(error.details) ? error.details : undefined;

	if (message)
		return t(
			message,
			objectMap(details ?? {}, ({ key, value }) => ({ key, value: t(value) })),
		);

	return getErrorMessage(defaultMessage);
}
