import { translationHelper } from './i18n/i18nHelper';

const isObject = (obj: unknown): obj is object => (typeof obj === 'object' || typeof obj === 'function') && obj !== null;

const hasProperty = <TProperty extends number | string | symbol>(
	obj: unknown,
	property: TProperty,
): obj is { [key in TProperty]: unknown } => isObject(obj) && property in obj;

const hasJQueryXHR = (error: object): error is { xhr: JQuery.jqXHR } => hasProperty(error, 'xhr') && hasProperty(error.xhr, 'responseJSON');

export function getErrorMessage(error: unknown, defaultMessage?: string): string {
	if (typeof error === 'string') {
		return translationHelper.t(error);
	}

	if (!isObject(error)) {
		if (defaultMessage) return getErrorMessage(defaultMessage);

		throw new TypeError('no default error message specified');
	}

	if (hasJQueryXHR(error)) {
		return getErrorMessage(error.xhr.responseJSON, defaultMessage);
	}

	const message =
		(hasProperty(error, 'reason') && typeof error.reason === 'string' ? error.reason : undefined) ??
		(hasProperty(error, 'error') && typeof error.error === 'string' ? error.error : undefined) ??
		(hasProperty(error, 'message') && typeof error.message === 'string' ? error.message : undefined) ??
		defaultMessage;
	const details = hasProperty(error, 'details') && isObject(error.details) ? error.details : undefined;

	if (message)
		return translationHelper.t(
			message,
			Object.fromEntries(Object.entries(details ?? {}).map(([key, value]) => [key, translationHelper.t(value)])),
		);

	return getErrorMessage(defaultMessage);
}
