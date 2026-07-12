import { Settings } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { notifyOnSettingChangedById } from '../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../app/settings/server';
import { API } from '../../../server/api/api';
import { updateAuditedByUser } from '../../../server/settings/lib/auditedSettingUpdates';
import {
	createGraphProvider,
	encryptCalendarSetting,
	generateWebhookClientState,
	getEnterpriseCalendarHealth,
	invalidateGraphSubscriptions,
	recordGraphConnectionTest,
	requestEnterpriseCalendarResync,
} from '../enterprise-calendar/runtime';

type ConfigureBody =
	| { credentialType: 'client-secret'; clientSecret: string; webhookClientState?: string }
	| { credentialType: 'certificate'; certificate: string; privateKey: string; webhookClientState?: string };

const configureBody = ajv.compile<ConfigureBody>({
	oneOf: [
		{
			type: 'object',
			properties: {
				credentialType: { const: 'client-secret' },
				clientSecret: { type: 'string', minLength: 1, maxLength: 4096 },
				webhookClientState: { type: 'string', minLength: 32, maxLength: 255 },
			},
			required: ['credentialType', 'clientSecret'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				credentialType: { const: 'certificate' },
				certificate: { type: 'string', minLength: 1, maxLength: 16384 },
				privateKey: { type: 'string', minLength: 1, maxLength: 32768 },
				webhookClientState: { type: 'string', minLength: 32, maxLength: 255 },
			},
			required: ['credentialType', 'certificate', 'privateKey'],
			additionalProperties: false,
		},
	],
});

const testBody = ajv.compile<{ mailbox?: string }>({
	type: 'object',
	properties: { mailbox: { type: 'string', format: 'email', maxLength: 320 } },
	additionalProperties: false,
});

const resyncBody = ajv.compile<{ userId?: string }>({
	type: 'object',
	properties: { userId: { type: 'string', minLength: 1, maxLength: 64 } },
	additionalProperties: false,
});

const genericResponse = ajv.compile({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] }, result: { type: 'object' } },
	required: ['success', 'result'],
	additionalProperties: false,
});

API.v1.post(
	'enterprise-calendar.configure-graph-credential',
	{
		authRequired: true,
		permissionsRequired: ['edit-privileged-setting'],
		license: ['outlook-calendar'],
		body: configureBody,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60_000 },
		response: {
			200: genericResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const updates: Array<[string, string]> = [['Enterprise_Calendar_Graph_Credential_Type', this.bodyParams.credentialType]];
		if (this.bodyParams.credentialType === 'client-secret') {
			updates.push([
				'Enterprise_Calendar_Graph_Client_Secret',
				encryptCalendarSetting('Enterprise_Calendar_Graph_Client_Secret', this.bodyParams.clientSecret),
			]);
			updates.push(['Enterprise_Calendar_Graph_Certificate', ''], ['Enterprise_Calendar_Graph_Private_Key', '']);
		} else {
			updates.push(
				[
					'Enterprise_Calendar_Graph_Certificate',
					encryptCalendarSetting('Enterprise_Calendar_Graph_Certificate', this.bodyParams.certificate),
				],
				[
					'Enterprise_Calendar_Graph_Private_Key',
					encryptCalendarSetting('Enterprise_Calendar_Graph_Private_Key', this.bodyParams.privateKey),
				],
			);
			updates.push(['Enterprise_Calendar_Graph_Client_Secret', '']);
		}
		if (this.bodyParams.webhookClientState || !settings.get<string>('Enterprise_Calendar_Graph_Webhook_Client_State')) {
			const clientState = this.bodyParams.webhookClientState ?? generateWebhookClientState();
			updates.push([
				'Enterprise_Calendar_Graph_Webhook_Client_State',
				encryptCalendarSetting('Enterprise_Calendar_Graph_Webhook_Client_State', clientState),
			]);
		}
		const audit = updateAuditedByUser({
			_id: this.userId,
			username: this.user.username ?? '',
			ip: this.requestIp ?? '',
			useragent: this.request.headers.get('user-agent') ?? '',
		});
		for (const [id, value] of updates) {
			await audit(Settings.updateValueById, id, value);
			void notifyOnSettingChangedById(id);
		}
		if (updates.some(([id]) => id === 'Enterprise_Calendar_Graph_Webhook_Client_State')) {
			await invalidateGraphSubscriptions();
		}
		return API.v1.success({ result: { credentialConfigured: true, webhookClientStateConfigured: true } });
	},
);

API.v1.get(
	'enterprise-calendar.health',
	{
		authRequired: true,
		permissionsRequired: ['view-privileged-setting'],
		license: ['outlook-calendar'],
		response: {
			200: genericResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		return API.v1.success({ result: await getEnterpriseCalendarHealth() });
	},
);

API.v1.post(
	'enterprise-calendar.resync',
	{
		authRequired: true,
		permissionsRequired: ['edit-privileged-setting'],
		license: ['outlook-calendar'],
		body: resyncBody,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60_000 },
		response: {
			200: genericResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		return API.v1.success({ result: { queuedUsers: await requestEnterpriseCalendarResync(this.bodyParams.userId) } });
	},
);

API.v1.post(
	'enterprise-calendar.test-graph',
	{
		authRequired: true,
		permissionsRequired: ['view-privileged-setting'],
		license: ['outlook-calendar'],
		body: testBody,
		rateLimiterOptions: { numRequestsAllowed: 3, intervalTimeInMS: 60_000 },
		response: {
			200: genericResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const validation = await createGraphProvider().validateConfiguration(
			this.bodyParams.mailbox ? { provider: 'microsoft-graph', address: this.bodyParams.mailbox } : undefined,
		);
		await recordGraphConnectionTest(validation);
		return API.v1.success({ result: validation });
	},
);
