import type { IMethodConnection, IPasskey } from '@rocket.chat/core-typings';
import { Passkeys } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateNotFoundErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';

import type { PasskeyRequestOptions } from '../../lib/passkeys/loginWithPasskey';
import { createPasskeyAuthenticationOptions, loginWithPasskey } from '../../lib/passkeys/loginWithPasskey';
import type { PasskeyCreationOptions } from '../../lib/passkeys/registerPasskey';
import { createPasskeyRegistrationOptions, registerPasskey } from '../../lib/passkeys/registerPasskey';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const voidSuccessResponse = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

type PasskeySummary = Pick<
	IPasskey,
	| '_id'
	| 'name'
	| 'deviceType'
	| 'backedUp'
	| 'transports'
	| 'authenticatorAttachment'
	| 'createdAt'
	| 'createdFrom'
	| 'lastUsedAt'
	| 'lastUsedFrom'
>;

const passkeySummaryProjection = {
	_id: 1,
	name: 1,
	deviceType: 1,
	backedUp: 1,
	transports: 1,
	authenticatorAttachment: 1,
	createdAt: 1,
	createdFrom: 1,
	lastUsedAt: 1,
	lastUsedFrom: 1,
} as const;

const sessionDeviceSchema = {
	type: 'object',
	properties: {
		type: { type: 'string' },
		name: { type: 'string' },
		longVersion: { type: 'string' },
		version: { type: 'string' },
		os: {
			type: 'object',
			properties: { name: { type: 'string' }, version: { type: 'string' } },
			additionalProperties: false,
		},
	},
	additionalProperties: false,
};

const passkeySummarySchema = {
	type: 'object',
	properties: {
		_id: { type: 'string' },
		name: { type: 'string' },
		deviceType: { type: 'string', enum: ['singleDevice', 'multiDevice'] },
		backedUp: { type: 'boolean' },
		transports: { type: 'array', items: { type: 'string' } },
		authenticatorAttachment: { type: 'string', enum: ['platform', 'cross-platform'] },
		createdAt: { type: 'string' },
		createdFrom: sessionDeviceSchema,
		lastUsedAt: { type: 'string' },
		lastUsedFrom: sessionDeviceSchema,
	},
	required: ['_id', 'name', 'deviceType', 'backedUp', 'createdAt'],
	additionalProperties: false,
};

const passkeyNameSchema = { type: 'string', minLength: 1, maxLength: 64, pattern: '\\S' };

const passkeyIdSchema = { type: 'string', minLength: 1, maxLength: 64 };

const MAX_CREDENTIAL_ID_BYTES = 1023;
const MAX_USER_HANDLE_BYTES = 64;

const base64url = (maxBytes: number) => ({
	type: 'string',
	minLength: 1,
	maxLength: Math.ceil((maxBytes * 4) / 3),
	pattern: '^[A-Za-z0-9_-]+$',
});
const credentialIdSchema = base64url(MAX_CREDENTIAL_ID_BYTES);

const credentialSchema = (response: Record<string, unknown>, required: string[]) => ({
	type: 'object',
	properties: {
		id: credentialIdSchema,
		rawId: credentialIdSchema,
		type: { type: 'string', enum: ['public-key'] },
		authenticatorAttachment: { type: 'string', enum: ['platform', 'cross-platform'] },
		clientExtensionResults: { type: 'object' },
		response: { type: 'object', properties: response, required, additionalProperties: false },
	},
	required: ['id', 'rawId', 'type', 'clientExtensionResults', 'response'],
	additionalProperties: false,
});

const registrationCredentialSchema = credentialSchema(
	{
		clientDataJSON: base64url(3072),
		attestationObject: base64url(24576),
		authenticatorData: base64url(6144),
		transports: { type: 'array', maxItems: 16, items: { type: 'string', maxLength: 32 } },
		publicKeyAlgorithm: { type: 'integer' },
		publicKey: base64url(6144),
	},
	['clientDataJSON', 'attestationObject'],
);

const authenticationCredentialSchema = credentialSchema(
	{
		clientDataJSON: base64url(3072),
		authenticatorData: base64url(6144),
		signature: base64url(1536),
		userHandle: base64url(MAX_USER_HANDLE_BYTES),
	},
	['clientDataJSON', 'authenticatorData', 'signature', 'userHandle'],
);

const registrationOptionsResponse = ajv.compile<{ options: PasskeyCreationOptions }>({
	type: 'object',
	properties: {
		options: { type: 'object' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['options', 'success'],
	additionalProperties: false,
});

const authenticationOptionsResponse = ajv.compile<{ options: PasskeyRequestOptions }>({
	type: 'object',
	properties: {
		options: { type: 'object' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['options', 'success'],
	additionalProperties: false,
});

const passkeysEndpoints = API.v1
	.get(
		'passkeys.list',
		{
			authRequired: true,
			response: {
				200: ajv.compile<{ passkeys: PasskeySummary[] }>({
					type: 'object',
					properties: {
						passkeys: { type: 'array', items: passkeySummarySchema },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['passkeys', 'success'],
					additionalProperties: false,
				}),
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const passkeys = await Passkeys.findByUserId(this.userId, { projection: passkeySummaryProjection, sort: { createdAt: 1 } }).toArray();

			return API.v1.success({ passkeys });
		},
	)
	.post(
		'passkeys.generateRegistrationOptions',
		{
			authRequired: true,
			twoFactorRequired: true,
			twoFactorOptions: { requireSecondFactor: true },
			response: {
				200: registrationOptionsResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const options = await createPasskeyRegistrationOptions(this.user);

			return API.v1.success({ options });
		},
	)
	.post(
		'passkeys.register',
		{
			authRequired: true,
			body: ajv.compile<{ name: string; credential: RegistrationResponseJSON }>({
				type: 'object',
				properties: {
					name: passkeyNameSchema,
					credential: registrationCredentialSchema,
				},
				required: ['name', 'credential'],
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile<{ passkey: PasskeySummary }>({
					type: 'object',
					properties: {
						passkey: passkeySummarySchema,
						success: { type: 'boolean', enum: [true] },
					},
					required: ['passkey', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { _id, name, deviceType, backedUp, transports, authenticatorAttachment, createdAt, createdFrom } = await registerPasskey(
				this.userId,
				this.bodyParams.name.trim(),
				this.bodyParams.credential,
				this.request.headers.get('user-agent') ?? '',
			);

			return API.v1.success({
				passkey: {
					_id,
					name,
					deviceType,
					backedUp,
					createdAt,
					...(transports && { transports }),
					...(authenticatorAttachment && { authenticatorAttachment }),
					...(createdFrom && { createdFrom }),
				},
			});
		},
	)
	.post(
		'passkeys.rename',
		{
			authRequired: true,
			body: ajv.compile<{ passkeyId: string; name: string }>({
				type: 'object',
				properties: {
					passkeyId: passkeyIdSchema,
					name: passkeyNameSchema,
				},
				required: ['passkeyId', 'name'],
				additionalProperties: false,
			}),
			response: {
				200: voidSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				404: validateNotFoundErrorResponse,
			},
		},
		async function action() {
			const { matchedCount } = await Passkeys.setNameByIdAndUserId(this.bodyParams.passkeyId, this.userId, this.bodyParams.name.trim());
			if (!matchedCount) {
				return API.v1.notFound();
			}

			return API.v1.success();
		},
	)
	.post(
		'passkeys.delete',
		{
			authRequired: true,
			twoFactorRequired: true,
			body: ajv.compile<{ passkeyId: string }>({
				type: 'object',
				properties: {
					passkeyId: passkeyIdSchema,
				},
				required: ['passkeyId'],
				additionalProperties: false,
			}),
			response: {
				200: voidSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				404: validateNotFoundErrorResponse,
			},
		},
		async function action() {
			const { deletedCount } = await Passkeys.removeByIdAndUserId(this.bodyParams.passkeyId, this.userId);
			if (!deletedCount) {
				return API.v1.notFound();
			}

			return API.v1.success();
		},
	)
	.post(
		'passkeys.generateAuthenticationOptions',
		{
			authRequired: false,
			response: {
				200: authenticationOptionsResponse,
				400: validateBadRequestErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const options = await createPasskeyAuthenticationOptions();

			return API.v1.success({ options });
		},
	)
	.post(
		'passkeys.login',
		{
			authRequired: false,
			body: ajv.compile<{ credential: AuthenticationResponseJSON }>({
				type: 'object',
				properties: {
					credential: authenticationCredentialSchema,
				},
				required: ['credential'],
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile<{ userId: string; authToken: string }>({
					type: 'object',
					properties: {
						userId: { type: 'string' },
						authToken: { type: 'string' },
						success: { type: 'boolean', enum: [true] },
					},
					required: ['userId', 'authToken', 'success'],
					additionalProperties: false,
				}),
				400: validateBadRequestErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const connection: IMethodConnection = {
				...this.connection,
				onClose: () => undefined,
				httpHeaders: Object.fromEntries(this.request.headers.entries()),
			};

			return API.v1.success(await loginWithPasskey(this.bodyParams.credential, connection));
		},
	);

type PasskeysEndpoints = ExtractRoutesFromAPI<typeof passkeysEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// oxlint-disable-next-line @typescript-eslint/no-empty-interface
	interface Endpoints extends PasskeysEndpoints {}
}
