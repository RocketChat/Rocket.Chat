import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';
import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { notifyOnSubscriptionsChangedByRoomIdsAndUserId } from '../../lib/notifyListener';
import { API } from '../api';

const isRoomsSetCategoryParamsPOST = ajv.compile<{ roomIds: string[]; category: string | null }>({
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
			not: { enum: [...SIDEBAR_SYSTEM_GROUP_KEYS] },
		},
	},
	required: ['roomIds', 'category'],
	additionalProperties: false,
});

API.experimental.post(
	'rooms.setCategory',
	{
		authRequired: true,
		license: ['experimental-enterprise-features'],
		body: isRoomsSetCategoryParamsPOST,
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

		if (category !== null) {
			const categories: Array<{ _id: string }> = user.settings?.preferences?.sidebarCategories ?? [];
			if (!categories.some((cat) => cat._id === category)) {
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
