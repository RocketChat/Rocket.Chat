import fastRedact from 'fast-redact';

export const redactionFields = {
	'cookie': 'cookie',
	'x-auth-token': '["x-auth-token"]',
	'authorization': 'authorization',
	'access_token': 'access_token',
	'customFields': 'customFields.*',
	'emails': 'emails[*].address',
	'email': 'email',
	'password': 'password',
	'pass': 'pass',
};

const redactor = fastRedact({
	paths: Object.values(redactionFields),
	serialize: false,
	strict: false,
});

export function redact(value: unknown): void {
	if (!value || typeof value !== 'object') return;

	if (Array.isArray(value)) {
		return value.forEach(redact);
	}

	redactor(value);

	Object.entries(value).forEach(([key, val]) => {
		// Don't recurse into properties that have already been redacted
		if (!(key in redactionFields)) {
			redact(val);
		}
	});
}
