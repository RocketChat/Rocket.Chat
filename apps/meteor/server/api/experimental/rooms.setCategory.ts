import { Subscriptions, Users } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { notifyOnSubscriptionsChangedByRoomIdsAndUserId } from '../../lib/notifyListener';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const setCategory = ajv.compile<{ roomIds: string[]; category: string | null }>({
	type: 'object',
	properties: {
		roomIds: {
			type: 'array',
			items: { type: 'string', minLength: 1 },
			minItems: 1,
			uniqueItems: true,
		},
		category: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['roomIds', 'category'],
	additionalProperties: false,
});

const roomsSetCategoryEndpoints = API.experimental.post(
	'rooms.setCategory',
	{
		authRequired: true,
		license: ['experimental-enterprise-features'],
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
		const { roomIds, category } = this.bodyParams;
		const { userId } = this;

		const user = await Users.findOneById(userId, { projection: { 'settings.preferences.sidebarCategories': 1 } });
		if (!user) {
			return API.experimental.failure('error-invalid-user');
		}

		// When assigning to a category, verify it exists in the user's preferences.
		if (category !== null) {
			const categories: Array<{ _id: string }> = user.settings?.preferences?.sidebarCategories ?? [];
			const exists = categories.some((cat) => cat._id === category);
			if (!exists) {
				return API.experimental.failure('error-invalid-param', 'Category not found in user preferences.');
			}
		}

		const { modifiedCount } = await Subscriptions.setCategoryByRoomIdsAndUserId(roomIds, userId, category);

		if (modifiedCount) {
			void notifyOnSubscriptionsChangedByRoomIdsAndUserId(roomIds, userId);
		}

		return API.experimental.success();
	},
);

type RoomsSetCategoryEndpoints = ExtractRoutesFromAPI<typeof roomsSetCategoryEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface ExperimentalEndpoints extends RoomsSetCategoryEndpoints {}
}
