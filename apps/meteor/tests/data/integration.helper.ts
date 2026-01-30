import type { Credentials } from '@rocket.chat/api-client';
import type { IIntegration } from '@rocket.chat/core-typings';
import type { IntegrationsCreateProps } from '@rocket.chat/rest-typings';

import { api, credentials, request } from './api-data';

export const createIntegration = (integration: IntegrationsCreateProps, userCredentials: Credentials) =>
	new Promise<IIntegration>((resolve, reject) => {
		void request
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

export const removeIntegration = (integrationId: IIntegration['_id'], type: 'incoming' | 'outgoing') =>
	new Promise<void>((resolve) => {
		void request
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
