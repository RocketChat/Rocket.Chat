import { api, credentials, request } from './api-data';

export const createIntegration = (integration, userCredentials) =>
	new Promise((resolve, reject) => {
		request
			.post(api('integrations.create'))
			.set(userCredentials)
			.send(integration)
			.end((err, res) => {
				if (err) {
					reject(err);
					return;
				}

				if (!res.body.success) {
					reject(res.body);
					return;
				}

				resolve(res.body.integration);
			});
	});

export const removeIntegration = (integrationId, type) =>
	new Promise((resolve, reject) => {
		request
			.post(api('integrations.remove'))
			.set(credentials)
			.send({
				type: `webhook-${type}`,
				integrationId,
			})
			.end((err, res) => {
				if (err) {
					console.warn(err);
				}

				if (!res.body.success) {
					console.warn(res.body);
				}

				resolve();
			});
	});
