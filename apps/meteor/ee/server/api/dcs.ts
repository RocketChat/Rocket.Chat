import type { ISecurityClearance, ISecurityLabel, IUser, SecurityLabelCatalogItem } from '@rocket.chat/core-typings';
import { buildCatalog, canAccess, categoryKey, clearanceForPolicy, defaultCatalogEntries, validateLabel } from '@rocket.chat/dcs';
import type { CatalogEntry } from '@rocket.chat/dcs';
import { Rooms, Users } from '@rocket.chat/models';
import { ajv, ajvQuery } from '@rocket.chat/rest-typings';
import {
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings/src/v1/Ajv';

import { API } from '../../../server/api';
import type { ExtractRoutesFromAPI } from '../../../server/api/ApiClass';
import { canAccessRoomIdAsync } from '../../../server/lib/authorization/canAccessRoom';
import { notifyOnRoomChangedById } from '../../../server/lib/notifyListener';
import { settings } from '../../../server/settings';
import { policies } from '../lib/dcs/policies';

const categorySchema = {
	type: 'object',
	properties: {
		tagSetId: { type: 'string' },
		tagType: { type: 'string', enum: ['restrictive', 'permissive', 'enumeratedRestrictive', 'enumeratedPermissive', 'informative'] },
		lacv: { type: 'string' },
	},
	required: ['tagSetId', 'tagType', 'lacv'],
	additionalProperties: false,
};

const labelSchema = {
	type: 'object',
	properties: {
		policyId: { type: 'string' },
		classification: { type: 'integer' },
		categories: { type: 'array', items: categorySchema },
	},
	required: ['policyId', 'classification', 'categories'],
	additionalProperties: false,
};

const clearanceSchema = {
	type: 'object',
	properties: {
		policyId: { type: 'string' },
		classifications: { type: 'array', items: { type: 'integer' } },
		categories: { type: 'array', items: categorySchema },
	},
	required: ['policyId', 'classifications', 'categories'],
	additionalProperties: false,
};

const successSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const labelKey = ({ policyId, classification, categories }: ISecurityLabel): string =>
	[policyId, classification, ...categories.map(categoryKey).sort()].join('#');

const configuredCatalog = (): CatalogEntry[] => {
	try {
		const parsed = JSON.parse(settings.get<string>('DCS_Catalog') || '[]');
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

const assertEnabled = () => {
	if (!settings.get<boolean>('DCS_Enabled')) {
		throw new Error('error-dcs-not-enabled');
	}
};

const dcsEndpoints = API.v1
	.get(
		'dcs/rooms/:rid/catalog',
		{
			authRequired: true,
			query: ajvQuery.compile<Record<string, never>>({ type: 'object', additionalProperties: true }),
			response: {
				200: ajv.compile<{ items: SecurityLabelCatalogItem[] }>({
					type: 'object',
					properties: { items: { type: 'array', items: { type: 'object' } }, success: { type: 'boolean', enum: [true] } },
					required: ['items', 'success'],
					additionalProperties: false,
				}),
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			license: ['abac'],
		},
		async function action() {
			assertEnabled();
			const { rid } = this.urlParams;
			if (!(await canAccessRoomIdAsync(rid, this.userId))) {
				return API.v1.forbidden();
			}

			const room = await Rooms.findOneById(rid, { projection: { securityClearance: 1, defaultSecurityLabel: 1 } });
			const roomClearance = room?.securityClearance;
			const policy = roomClearance && policies.find(roomClearance.policyId);
			if (!roomClearance || !policy) {
				return API.v1.success({ items: [] });
			}

			const user = await Users.findOneById<Pick<IUser, 'securityClearances' | 'language'>>(this.userId, {
				projection: { securityClearances: 1, language: 1 },
			});
			const senderClearance = clearanceForPolicy(user?.securityClearances, policy.id);
			if (!senderClearance) {
				return API.v1.success({ items: [] });
			}

			const configured = configuredCatalog().filter(({ label }) => label?.policyId === policy.id);
			const entries = [
				...(room.defaultSecurityLabel ? [{ label: room.defaultSecurityLabel }] : []),
				...(configured.length ? configured : defaultCatalogEntries(policy)),
			];
			const unique = [...new Map(entries.map((entry) => [labelKey(entry.label), entry])).values()];

			return API.v1.success({
				items: buildCatalog(policy, unique, [senderClearance, roomClearance], {
					defaultLabel: room.defaultSecurityLabel,
					lang: user?.language,
				}),
			});
		},
	)
	.post(
		'dcs/users/:userId/clearances',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			body: ajv.compile<{ clearances: ISecurityClearance[] }>({
				type: 'object',
				properties: { clearances: { type: 'array', items: clearanceSchema } },
				required: ['clearances'],
				additionalProperties: false,
			}),
			response: {
				200: successSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			license: ['abac'],
		},
		async function action() {
			assertEnabled();
			const { userId } = this.urlParams;
			const { clearances } = this.bodyParams;

			for (const clearance of clearances) {
				if (!policies.find(clearance.policyId)) {
					return API.v1.failure(`Unknown security policy: ${clearance.policyId}`);
				}
			}

			const updated = clearances.length
				? await Users.setSecurityClearancesById(userId, clearances)
				: await Users.unsetSecurityClearancesById(userId);
			return updated ? API.v1.success() : API.v1.failure('error-invalid-user');
		},
	)
	.post(
		'dcs/rooms/:rid/clearance',
		{
			authRequired: true,
			permissionsRequired: ['abac-management'],
			body: ajv.compile<{ clearance: ISecurityClearance; defaultLabel: ISecurityLabel }>({
				type: 'object',
				properties: { clearance: clearanceSchema, defaultLabel: labelSchema },
				required: ['clearance', 'defaultLabel'],
				additionalProperties: false,
			}),
			response: {
				200: successSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			license: ['abac'],
		},
		async function action() {
			assertEnabled();
			const { rid } = this.urlParams;
			const { clearance, defaultLabel } = this.bodyParams;

			const policy = policies.find(clearance.policyId);
			if (!policy) {
				return API.v1.failure(`Unknown security policy: ${clearance.policyId}`);
			}
			const violations = validateLabel(policy, defaultLabel);
			if (violations.length) {
				return API.v1.failure(`Invalid default label: ${violations.map(({ code }) => code).join(', ')}`);
			}
			if (!canAccess(policy, defaultLabel, clearance)) {
				return API.v1.failure('The default label is outside the room clearance');
			}

			const updated = await Rooms.setSecurityClearanceById(rid, clearance, defaultLabel);
			if (!updated) {
				return API.v1.failure('error-invalid-room');
			}
			void notifyOnRoomChangedById(rid);
			return API.v1.success();
		},
	);

export type DcsEndpoints = ExtractRoutesFromAPI<typeof dcsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends DcsEndpoints {}
}
