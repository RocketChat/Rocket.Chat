import fastRedact from 'fast-redact';

const requestFields = [
	'headers.Cookie',
	'headers.cookie',
	'headers["x-auth-token"]',
	'headers["X-Auth-Token"]',
	'headers.auth',
	'headers.Auth',
	'headers.authorization',
	'headers.Authorization',
	'headers.access_token',
	'content.password',
	'content.pass',
	'data.password',
	'data.pass',
];

const entityFields = ['password', 'pass', 'customFields.*', '_unmappedProperties_'];

const roomFields = ['customFields.*', '_unmappedProperties_', ...entityFields.map((field) => `creator.${field}`)];

export const redactionFieldPaths = [
	// Incoming requests to the Apps API endpoints
	...requestFields,
	...entityFields.map((field) => `user.${field}`),
	'query.access_token',
	'query.query', // The deprecated `query` search param
	// Outgoing requests from the Apps to the outter webs
	...requestFields.map((field) => `request.${field}`),
	`request.query`, // `query` here is a string, so we have to redact it all
	// Slashcommands
	...roomFields.map((field) => `params[0].room.${field}`),
	...entityFields.map((field) => `params[0].sender.${field}`),
];

export const redact = fastRedact({
	paths: redactionFieldPaths,
	censor: '[Redacted]',
	serialize: false,
	strict: false,
});
