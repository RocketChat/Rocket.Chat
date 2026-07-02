import type { CloudRegistrationIntentData, CloudConfirmationPollData, CloudRegistrationStatus } from '@rocket.chat/core-typings';
import {
	ajv,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';

import { CloudWorkspaceRegistrationError } from '../../../../lib/errors/CloudWorkspaceRegistrationError';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { getCheckoutUrl } from '../../../cloud/server/functions/getCheckoutUrl';
import { getConfirmationPoll } from '../../../cloud/server/functions/getConfirmationPoll';
import {
	CloudWorkspaceAccessTokenEmptyError,
	CloudWorkspaceAccessTokenError,
} from '../../../cloud/server/functions/getWorkspaceAccessToken';
import { registerPreIntentWorkspaceWizard } from '../../../cloud/server/functions/registerPreIntentWorkspaceWizard';
import { removeLicense } from '../../../cloud/server/functions/removeLicense';
import { retrieveRegistrationStatus } from '../../../cloud/server/functions/retrieveRegistrationStatus';
import { saveRegistrationData, saveRegistrationDataManual } from '../../../cloud/server/functions/saveRegistrationData';
import { startRegisterWorkspaceSetupWizard } from '../../../cloud/server/functions/startRegisterWorkspaceSetupWizard';
import { syncWorkspace } from '../../../cloud/server/functions/syncWorkspace';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

type CloudManualRegister = {
	cloudBlob: string;
};

type CloudCreateRegistrationIntent = {
	resend: boolean;
	email: string;
};

type CloudConfirmationPoll = {
	deviceCode: string;
	resend?: string;
};

const CloudConfirmationPollSchema = {
	type: 'object',
	properties: {
		deviceCode: { type: 'string' },
		resend: { type: 'string' },
	},
	required: ['deviceCode'],
	additionalProperties: false,
};

const CloudCreateRegistrationIntentSchema = {
	type: 'object',
	properties: {
		resend: { type: 'boolean' },
		email: { type: 'string' },
	},
	required: ['resend', 'email'],
	additionalProperties: false,
};

const CloudManualRegisterSchema = {
	type: 'object',
	properties: {
		cloudBlob: { type: 'string' },
	},
	required: ['cloudBlob'],
	additionalProperties: false,
};

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const isCloudConfirmationPollProps = ajv.compile<CloudConfirmationPoll>(CloudConfirmationPollSchema);

const isCloudCreateRegistrationIntentProps = ajv.compile<CloudCreateRegistrationIntent>(CloudCreateRegistrationIntentSchema);

const isCloudManualRegisterProps = ajv.compile<CloudManualRegister>(CloudManualRegisterSchema);

const manualRegisterResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const createRegistrationIntentResponseSchema = ajv.compile<{ intentData: CloudRegistrationIntentData }>({
	type: 'object',
	properties: {
		intentData: { $ref: '#/components/schemas/CloudRegistrationIntentData' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['intentData', 'success'],
	additionalProperties: false,
});

const registerPreIntentResponseSchema = ajv.compile<{ offline: boolean }>({
	type: 'object',
	properties: {
		offline: { type: 'boolean' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['offline', 'success'],
	additionalProperties: false,
});

const confirmationPollResponseSchema = ajv.compile<{ pollData: CloudConfirmationPollData }>({
	type: 'object',
	properties: {
		pollData: {
			oneOf: [
				{ $ref: '#/components/schemas/CloudConfirmationPollDataPending' },
				{ $ref: '#/components/schemas/CloudConfirmationPollDataSuccess' },
			],
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['pollData', 'success'],
	additionalProperties: false,
});

const registrationStatusResponseSchema = ajv.compile<{ registrationStatus: CloudRegistrationStatus }>({
	type: 'object',
	properties: {
		registrationStatus: { $ref: '#/components/schemas/CloudRegistrationStatus' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['registrationStatus', 'success'],
	additionalProperties: false,
});

const checkoutUrlResponseSchema = ajv.compile<{ url: string }>({
	type: 'object',
	properties: {
		url: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['url', 'success'],
	additionalProperties: false,
});

const cloudEndpoints = API.v1
	.post(
		'cloud.manualRegister',
		{
			authRequired: true,
			permissionsRequired: ['register-on-cloud'],
			body: isCloudManualRegisterProps,
			response: {
				200: manualRegisterResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const registrationInfo = await retrieveRegistrationStatus();

			if (registrationInfo.workspaceRegistered) {
				return API.v1.failure('Workspace is already registered');
			}

			const settingsData = JSON.parse(Buffer.from(this.bodyParams.cloudBlob, 'base64').toString());

			await saveRegistrationDataManual(settingsData);

			return API.v1.success();
		},
	)
	.post(
		'cloud.createRegistrationIntent',
		{
			authRequired: true,
			permissionsRequired: ['manage-cloud'],
			body: isCloudCreateRegistrationIntentProps,
			response: {
				200: createRegistrationIntentResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const intentData = await startRegisterWorkspaceSetupWizard(this.bodyParams.resend, this.bodyParams.email);

			if (intentData) {
				return API.v1.success({ intentData });
			}

			return API.v1.failure('Invalid query');
		},
	)
	.post(
		'cloud.registerPreIntent',
		{
			authRequired: true,
			permissionsRequired: ['manage-cloud'],
			response: {
				200: registerPreIntentResponseSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			return API.v1.success({ offline: !(await registerPreIntentWorkspaceWizard()) });
		},
	)
	.get(
		'cloud.confirmationPoll',
		{
			authRequired: true,
			permissionsRequired: ['manage-cloud'],
			query: isCloudConfirmationPollProps,
			response: {
				200: confirmationPollResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { deviceCode } = this.queryParams;

			const pollData = await getConfirmationPoll(deviceCode);
			if (pollData) {
				if ('successful' in pollData && pollData.successful) {
					await saveRegistrationData(pollData.payload);
				}
				return API.v1.success({ pollData });
			}

			return API.v1.failure('Invalid query');
		},
	)
	.get(
		'cloud.registrationStatus',
		{
			authRequired: true,
			permissionsRequired: ['manage-cloud'],
			response: {
				200: registrationStatusResponseSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const registrationStatus = await retrieveRegistrationStatus();

			return API.v1.success({ registrationStatus });
		},
	)
	.post(
		'cloud.syncWorkspace',
		{
			authRequired: true,
			permissionsRequired: ['manage-cloud'],
			rateLimiterOptions: { numRequestsAllowed: 2, intervalTimeInMS: 60000 },
			response: {
				200: successResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			try {
				await syncWorkspace();

				return API.v1.success();
			} catch (error) {
				return API.v1.failure('Error during workspace sync');
			}
		},
	)
	.post(
		'cloud.removeLicense',
		{
			authRequired: true,
			permissionsRequired: ['manage-cloud'],
			rateLimiterOptions: { numRequestsAllowed: 2, intervalTimeInMS: 60000 },
			response: {
				200: successResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			try {
				await removeLicense();
				return API.v1.success();
			} catch (error) {
				switch (true) {
					case error instanceof CloudWorkspaceRegistrationError:
					case error instanceof CloudWorkspaceAccessTokenEmptyError:
					case error instanceof CloudWorkspaceAccessTokenError: {
						SystemLogger.info({
							msg: 'Manual license removal failed',
							endpoint: 'cloud.removeLicense',
							error,
						});
						break;
					}
					default: {
						SystemLogger.error({
							msg: 'Manual license removal failed',
							endpoint: 'cloud.removeLicense',
							error,
						});
						break;
					}
				}
				return API.v1.failure('License removal failed');
			}
		},
	)
	.get(
		'cloud.checkoutUrl',
		{
			authRequired: true,
			permissionsRequired: ['manage-cloud'],
			response: {
				200: checkoutUrlResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const checkoutUrl = await getCheckoutUrl();

			if (!checkoutUrl.url) {
				return API.v1.failure();
			}

			return API.v1.success({ url: checkoutUrl.url });
		},
	);

type CloudEndpoints = ExtractRoutesFromAPI<typeof cloudEndpoints>;

/**
 * Declaring endpoint here because we don't want this available to the sdk client
 */
declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints extends CloudEndpoints {
		'/v1/cloud.checkoutUrl': {
			GET: () => { url: string };
		};
	}
}
