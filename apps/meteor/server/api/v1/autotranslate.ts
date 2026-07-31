import type { IMessage, ISupportedLanguage } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	isAutotranslateSaveSettingsParamsPOST,
	isAutotranslateGetSupportedLanguagesParamsGET,
} from '@rocket.chat/rest-typings';

import { autotranslateExamples } from './autotranslate.examples';
import { canAccessRoomAsync } from '../../lib/authorization';
import { getSupportedLanguages } from '../../lib/autotranslate/functions/getSupportedLanguages';
import { saveAutoTranslateSettings } from '../../lib/autotranslate/functions/saveSettings';
import { translateMessage } from '../../lib/autotranslate/functions/translateMessage';
import { settings } from '../../settings';
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
			summary: 'Get Supported Languages',
			description: `Get the list of languages supported by the translation service provider.
Make sure that the auto-translate feature is configured in your workspace. For details, see the <a href="https://docs.rocket.chat/v1/docs/auto-translate-messages" target="_blank">Auto-Translate</a> user guide.

### Changelog
| Version      | Description |
| ---------------- | ------------|
|1.3.0          | Added       |`,
			examples: autotranslateExamples['autotranslate.getSupportedLanguages'],
			tags: ['Auto-Translate'],
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
			summary: 'Save Auto-Translate  Settings',
			description: `Saves autotranslate settings for a room.
### Changelog
| Version      | Description |
| ---------------- | ------------|
|1.3.0          | Added       |`,
			examples: autotranslateExamples['autotranslate.saveSettings'],
			tags: ['Auto-Translate'],
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

			// ajv 2020-12 with coerceTypes coerces booleans to strings, so check for both
			if (field === 'autoTranslate' && value !== true && value !== 'true' && value !== false && value !== 'false') {
				return API.v1.failure('The bodyParam "autoTranslate" must be a boolean.');
			}

			if (field === 'autoTranslateLanguage' && (typeof value !== 'string' || !Number.isNaN(Number.parseInt(value)))) {
				return API.v1.failure('The bodyParam "autoTranslateLanguage" must be a string.');
			}

			await saveAutoTranslateSettings(this.userId, roomId, field, value === true || value === 'true' ? '1' : String(value), {
				defaultLanguage: defaultLanguage || '',
			});

			return API.v1.success();
		},
	)
	.post(
		'autotranslate.translateMessage',
		{
			summary: 'Translate Message',
			description: `Auto-translates the provided message.

The caller must have access to the room that contains the message.
If the caller is not a room member (or otherwise cannot access it), the endpoint returns \`403 Forbidden\` and no translation is performed.

### Changelog
| Version      | Description |
| ---------------- | ------------|
|1.3.0          | Added       |
|8.5.0          | Added room-access check. |`,
			examples: autotranslateExamples['autotranslate.translateMessage'],
			tags: ['Auto-Translate'],
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
				403: validateForbiddenErrorResponse,
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

			const room = await Rooms.findOneById(message.rid);
			if (!room || !(await canAccessRoomAsync(room, { _id: this.userId }))) {
				return API.v1.forbidden();
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
