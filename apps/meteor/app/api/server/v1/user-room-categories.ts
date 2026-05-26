import type { IUserRoomCategory } from '@rocket.chat/core-typings';
import { UserRoomCategories } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings';
import { check } from 'meteor/check';

import { API } from '../api';

const createCategoryBodySchema = ajv.compile<{ name: string }>({
	type: 'object',
	properties: {
		name: { type: 'string' },
	},
	required: ['name'],
	additionalProperties: false,
});

const addRoomToCategoryBodySchema = ajv.compile<{ categoryName: string; roomId: string }>({
	type: 'object',
	properties: {
		categoryName: { type: 'string' },
		roomId: { type: 'string' },
	},
	required: ['categoryName', 'roomId'],
	additionalProperties: false,
});

const renameCategoryBodySchema = ajv.compile<{ oldName: string; newName: string }>({
	type: 'object',
	properties: {
		oldName: { type: 'string' },
		newName: { type: 'string' },
	},
	required: ['oldName', 'newName'],
	additionalProperties: false,
});

const categoriesResponseSchema = ajv.compile<{ categories: IUserRoomCategory[] }>({
	type: 'object',
	properties: {
		categories: {
			type: 'array',
			items: { type: 'object' },
		},
	},
	required: ['categories'],
	additionalProperties: true,
});

const emptyResponseSchema = ajv.compile<Record<string, unknown>>({
	type: 'object',
	additionalProperties: true,
});

API.v1.get(
	'user-room-categories',
	{
		authRequired: true,
		rateLimiterOptions: false,
		response: { 200: categoriesResponseSchema },
	},
	async function action() {
		const categories = (await UserRoomCategories.findByUserId(this.userId))?.categories ?? [];

		return API.v1.success({
			categories,
		});
	},
);

API.v1.post(
	'user-room-categories',
	{
		authRequired: true,
		rateLimiterOptions: false,
		body: createCategoryBodySchema,
		response: { 200: emptyResponseSchema, 400: emptyResponseSchema },
	},
	async function action() {
		const { name } = this.bodyParams;

		check(name, String);

		const categoryName = name.trim();

		if (!categoryName) {
			return API.v1.failure('Category name is required');
		}

		await UserRoomCategories.createCategory(this.userId, categoryName);

		return API.v1.success({});
	},
);

API.v1.post(
	'user-room-categories/add-room',
	{
		authRequired: true,
		rateLimiterOptions: false,
		body: addRoomToCategoryBodySchema,
		response: { 200: emptyResponseSchema, 400: emptyResponseSchema },
	},
	async function action() {
		const { categoryName, roomId } = this.bodyParams;

		check(categoryName, String);
		check(roomId, String);

		const trimmedName = categoryName.trim();
		const trimmedRoomId = roomId.trim();

		if (!trimmedName || !trimmedRoomId) {
			return API.v1.failure('categoryName and roomId are required');
		}

		await UserRoomCategories.addRoomToCategory(this.userId, trimmedName, trimmedRoomId);

		return API.v1.success({});
	},
);

API.v1.post(
	'user-room-categories/remove-room',
	{
		authRequired: true,
		rateLimiterOptions: false,
		body: addRoomToCategoryBodySchema,
		response: { 200: emptyResponseSchema, 400: emptyResponseSchema },
	},
	async function action() {
		const { categoryName, roomId } = this.bodyParams;

		check(categoryName, String);
		check(roomId, String);

		const trimmedName = categoryName.trim();
		const trimmedRoomId = roomId.trim();

		if (!trimmedName || !trimmedRoomId) {
			return API.v1.failure('categoryName and roomId are required');
		}

		await UserRoomCategories.removeRoomFromCategory(this.userId, trimmedName, trimmedRoomId);

		return API.v1.success({});
	},
);

API.v1.post(
	'user-room-categories/remove-category',
	{
		authRequired: true,
		body: createCategoryBodySchema,
		response: { 200: emptyResponseSchema, 400: emptyResponseSchema },
	},
	async function action() {
		const { name } = this.bodyParams;

		check(name, String);

		const trimmedName = name.trim();
		if (!trimmedName) {
			return API.v1.failure('Category name is required');
		}

		await UserRoomCategories.removeCategory(this.userId, trimmedName);

		return API.v1.success({});
	},
);

API.v1.post(
	'user-room-categories/rename-category',
	{
		authRequired: true,
		body: renameCategoryBodySchema,
		response: { 200: emptyResponseSchema, 400: emptyResponseSchema },
	},
	async function action() {
		const { oldName, newName } = this.bodyParams;

		check(oldName, String);
		check(newName, String);

		const trimmedOldName = oldName.trim();
		const trimmedNewName = newName.trim();

		if (!trimmedOldName || !trimmedNewName) {
			return API.v1.failure('oldName and newName are required');
		}

		await UserRoomCategories.renameCategory(this.userId, trimmedOldName, trimmedNewName);

		return API.v1.success({});
	},
);
