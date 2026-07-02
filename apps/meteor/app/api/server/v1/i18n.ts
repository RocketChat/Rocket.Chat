/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Logger } from '@rocket.chat/logger';
import { ajv, validateUnauthorizedErrorResponse, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

import { API } from '../api';

const logger = new Logger('AppsTranslations');

API.v1.get(
	'apps.translations',
	{
		authRequired: true,
		query: ajv.compile<{ language?: string }>({
			type: 'object',
			properties: {
				language: { type: 'string', minLength: 2 },
			},
			additionalProperties: false,
		}),
		response: {
			200: ajv.compile<{
				language: string;
				translations: { [key: string]: string };
				success: true;
			}>({
				type: 'object',
				properties: {
					language: { type: 'string' },
					translations: { type: 'object', additionalProperties: { type: 'string' } },
					success: { type: 'boolean', enum: [true] },
				},
				required: ['language', 'translations', 'success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const language = (this.queryParams.language ?? 'en').split('-')[0].toLowerCase();
		logger.debug({ msg: 'Fetching app translations', language, userId: this.userId });

		// lazy import inside the function — avoids circular init crash
		const { Apps } = await import('../../../../ee/server/apps/orchestrator');

		const manager = (Apps as any).getManager();
		if (!manager) {
			logger.error({ msg: 'Apps manager unavailable' });
			return API.v1.failure('Apps manager unavailable.');
		}

		const mergedTranslations: { [key: string]: string } = {};

		const apps = await manager.get({ enabled: true });
		logger.debug({ msg: 'Found enabled apps', count: apps.length });

		for (const app of apps) {
			try {
				const storageItem = app.getStorageItem() as {
					languageContent?: {
						[lang: string]: {
							[key: string]: string;
						};
					};
				};

				const langContent = storageItem.languageContent?.[language] ?? storageItem.languageContent?.en;

				if (!langContent) {
					logger.debug({ msg: 'No translations found for app', appId: app.getID(), language });
					continue;
				}

				const appId = app.getID();

				for (const [key, value] of Object.entries(langContent)) {
					mergedTranslations[`app-${appId}.${key}`] = value;
				}
			} catch (err) {
				logger.warn({ msg: 'Failed to get translations for app', appId: app.getID(), err });
			}
		}

		return API.v1.success({ language, translations: mergedTranslations });
	},
);
