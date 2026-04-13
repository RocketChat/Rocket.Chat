import type { IMessage, ISupportedLanguage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	isAutotranslateSaveSettingsParamsPOST,
	isAutotranslateGetSupportedLanguagesParamsGET,
} from '@rocket.chat/rest-typings';

import { getSupportedLanguages } from '../../../autotranslate/server/functions/getSupportedLanguages';
import { saveAutoTranslateSettings } from '../../../autotranslate/server/functions/saveSettings';
import { translateMessage } from '../../../autotranslate/server/functions/translateMessage';
import { settings } from '../../../settings/server';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

type AutotranslateTranslateMessageParamsPOST = {
	messageId: string;
	targetLanguage?: string;
};

const AutotranslateTranslateMessageParamsPostSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
		targetLanguage: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

const isAutotranslateTranslateMessageParamsPOST = ajv.compile<AutotranslateTranslateMessageParamsPOST>(
	AutotranslateTranslateMessageParamsPostSchema,
);

const autotranslateEndpoints = API.v1
	.get(
		'autotranslate.getSupportedLanguages',
		{
			authRequired: true,
			query: isAutotranslateGetSupportedLanguagesParamsGET,
			response: {
				200: ajv.compile<{ languages: ISupportedLanguage[] }>({
					type: 'object',
					properties: {
						languages: { type: 'array', items: { type: 'object' } },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['languages', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			if (!settings.get('AutoTranslate_Enabled')) {
				return API.v1.failure('AutoTranslate is disabled.');
			}
			const { targetLanguage } = this.queryParams;
			const languages = await getSupportedLanguages(this.userId, targetLanguage);

			return API.v1.success({ languages: languages || [] });
		},
	)
	.post(
		'autotranslate.saveSettings',
		{
			authRequired: true,
			body: isAutotranslateSaveSettingsParamsPOST,
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: { success: { type: 'boolean', enum: [true] } },
					required: ['success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { roomId, field, value, defaultLanguage } = this.bodyParams;
			if (!settings.get('AutoTranslate_Enabled')) {
				return API.v1.failure('AutoTranslate is disabled.');
			}

			if (!roomId) {
				return API.v1.failure('The bodyParam "roomId" is required.');
			}
			if (!field) {
				return API.v1.failure('The bodyParam "field" is required.');
			}
			if (value === undefined) {
				return API.v1.failure('The bodyParam "value" is required.');
			}
			if (field === 'autoTranslate' && typeof value !== 'boolean') {
				return API.v1.failure('The bodyParam "autoTranslate" must be a boolean.');
			}

			if (field === 'autoTranslateLanguage' && (typeof value !== 'string' || !Number.isNaN(Number.parseInt(value)))) {
				return API.v1.failure('The bodyParam "autoTranslateLanguage" must be a string.');
			}

			await saveAutoTranslateSettings(this.userId, roomId, field, value === true ? '1' : String(value).valueOf(), {
				defaultLanguage: defaultLanguage || '',
			});

			return API.v1.success();
		},
	)
	.post(
		'autotranslate.translateMessage',
		{
			authRequired: true,
			body: isAutotranslateTranslateMessageParamsPOST,
			response: {
				200: ajv.compile<{ message: IMessage }>({
					type: 'object',
					properties: {
						message: { $ref: '#/components/schemas/IMessage' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['message', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { messageId, targetLanguage } = this.bodyParams;
			if (!settings.get('AutoTranslate_Enabled')) {
				return API.v1.failure('AutoTranslate is disabled.');
			}
			if (!messageId) {
				return API.v1.failure('The bodyParam "messageId" is required.');
			}
			const message = await Messages.findOneById(messageId);
			if (!message) {
				return API.v1.failure('Message not found.');
			}

			const translatedMessage = await translateMessage(targetLanguage, message);

			if (!translatedMessage) {
				return API.v1.failure('Failed to translate message.');
			}

			return API.v1.success({ message: translatedMessage });
		},
	);

type AutotranslateEndpoints = ExtractRoutesFromAPI<typeof autotranslateEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends AutotranslateEndpoints {}
}
