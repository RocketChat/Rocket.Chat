import { api, credentials, request } from './api-data';

export const createIntegration = (integration, userCredentials) =>
	new Promise((resolve) => {
		request
			.post(api('integrations.create'))
			.set(userCredentials)
			.send(integration)
			.end((err, res) => {
				resolve(res.body.integration);
			});
	});

export const removeIntegration = (integrationId, type) =>
	new Promise((resolve) => {
		request
			.post(api('integrations.remove'))
			.set(credentials)
			.send({
				type: `webhook-${type}`,
				integrationId,
			})
			.end(resolve);
	});
