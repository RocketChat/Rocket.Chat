import { License } from '@rocket.chat/license';
import { Subscriptions, Users } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../lib/notifyListener';
import { API } from '../api';

const setCategory = ajv.compile<{ roomIds: string[]; category: string | null }>({
	type: 'object',
	properties: {
		roomIds: {
			type: 'array',
			items: { type: 'string' },
			minItems: 1,
		},
		category: {
			type: ['string', 'null'],
		},
	},
	required: ['roomIds', 'category'],
	additionalProperties: false,
});

API.experimental.post(
	'rooms.setCategory',
	{
		authRequired: true,
		body: setCategory,
		response: {
			200: ajv.compile<void>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [true] },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		if (!License.hasModule('experimental-enterprise-features')) {
			return API.experimental.failure('error-license-not-found', 'This is a premium feature.');
		}

		const { roomIds, category } = this.bodyParams;
		const { userId } = this;

		const user = await Users.findOneById(userId, { projection: { 'settings.preferences.sidebarCustomCategories': 1 } });
		if (!user) {
			return API.experimental.failure('error-invalid-user');
		}

		// When assigning to a category, verify it exists in the user's preferences.
		if (category !== null) {
			const categories: Array<{ _id: string }> = user.settings?.preferences?.sidebarCustomCategories ?? [];
			const exists = categories.some((cat) => cat._id === category);
			if (!exists) {
				return API.experimental.failure('error-invalid-param', 'Category not found in user preferences.');
			}
		}

		// Deduplicate so the subscription count check and notify loop are correct.
		const uniqueRoomIds = [...new Set(roomIds)];

		// Verify the user is subscribed to all specified rooms.
		const subs = await Subscriptions.findByUserIdAndRoomIds(userId, uniqueRoomIds, { projection: { rid: 1 } }).toArray();
		if (subs.length !== uniqueRoomIds.length) {
			return API.experimental.failure('error-invalid-param', 'One or more rooms not found in user subscriptions.');
		}

		const { modifiedCount } = await Subscriptions.setCategoryByRoomIdsAndUserId(uniqueRoomIds, userId, category);

		if (modifiedCount) {
			await Promise.all(uniqueRoomIds.map((rid) => notifyOnSubscriptionChangedByRoomIdAndUserId(rid, userId)));
		}

		return API.experimental.success();
	},
);
