import {getCredentials, request, api, credentials} from './api-data.js';

export const customFieldText = {
	type: 'text',
	required: true,
	minLength: 2,
	maxLength: 10
};

export function setCustomFields(customFields, done) {
	getCredentials((error) => {
		if (error) {
			return done(error);
		}

		const stringified = customFields ? JSON.stringify(customFields) : '';

		request.post(api('settings/Accounts_CustomFields'))
			.set(credentials)
			.send({ 'value': stringified })
			.expect(200)
			.end(done);
	});
}

export function clearCustomFields(done = () => {}) {
	setCustomFields(null, done);
}
