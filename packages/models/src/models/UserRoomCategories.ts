import type { IUserRoomCategories } from '@rocket.chat/core-typings';
import type { IUserRoomCategoriesModel } from '@rocket.chat/model-typings';
import type { Db, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class UserRoomCategoriesRaw extends BaseRaw<IUserRoomCategories> implements IUserRoomCategoriesModel {
	constructor(db: Db) {
		super(db, 'user_room_categories');
	}

	protected override modelIndexes() {
		return [{ key: { userId: 1 }, unique: true }];
	}

	findByUserId(userId: string): Promise<IUserRoomCategories | null> {
		return this.findOne({ userId });
	}

	async createCategory(userId: string, name: string): Promise<UpdateResult> {
		const trimmedName = name.trim();

		if (!trimmedName) {
			throw new Error('Category name is required');
		}

		const existing = await this.findByUserId(userId);

		if (existing?.categories.some((c) => c.name === trimmedName)) {
			throw new Error('Category already exists');
		}

		return this.updateOne(
			{ userId },
			{
				$push: {
					categories: {
						$each: [{ name: trimmedName, roomIds: [] }],
						$position: 0,
					},
				},
			},
			{ upsert: true },
		);
	}

	async addRoomToCategory(userId: string, categoryName: string, roomId: string): Promise<UpdateResult> {
		const doc = await this.findByUserId(userId);
		if (!doc) {
			throw new Error('User categories document not found');
		}

		const trimmedCategoryName = categoryName.trim();
		const trimmedRoomId = roomId.trim();

		const categoryExists = doc.categories.some((c) => c.name === trimmedCategoryName);
		if (!categoryExists) {
			throw new Error('Category not found');
		}

		const categoriesWithoutRoom = doc.categories.map((c) => ({
			...c,
			roomIds: (c.roomIds ?? []).filter((rid) => rid !== trimmedRoomId),
		}));

		const targetIndex = categoriesWithoutRoom.findIndex((c) => c.name === trimmedCategoryName);
		const target = categoriesWithoutRoom[targetIndex];

		categoriesWithoutRoom[targetIndex] = {
			...target,
			roomIds: Array.from(new Set([...(target?.roomIds ?? []), trimmedRoomId])),
		};

		return this.updateOne({ userId }, { $set: { categories: categoriesWithoutRoom } });
	}

	async removeRoomFromCategory(userId: string, categoryName: string, roomId: string): Promise<UpdateResult> {
		const doc = await this.findByUserId(userId);
		if (!doc) {
			throw new Error('User categories document not found');
		}

		const trimmedCategoryName = categoryName.trim();
		const trimmedRoomId = roomId.trim();

		const targetIndex = doc.categories.findIndex((c) => c.name === trimmedCategoryName);
		if (targetIndex === -1) {
			throw new Error('Category not found');
		}

		const categories = doc.categories.map((c, index) => {
			if (index !== targetIndex) {
				return c;
			}

			return {
				...c,
				roomIds: (c.roomIds ?? []).filter((rid) => rid !== trimmedRoomId),
			};
		});

		return this.updateOne({ userId }, { $set: { categories } });
	}

	async removeCategory(userId: string, name: string): Promise<UpdateResult> {
		const doc = await this.findByUserId(userId);
		if (!doc) {
			throw new Error('User categories document not found');
		}

		const trimmedName = name.trim();
		const categories = doc.categories.filter((c) => c.name !== trimmedName);

		return this.updateOne({ userId }, { $set: { categories } });
	}

	async renameCategory(userId: string, oldName: string, newName: string): Promise<UpdateResult> {
		const doc = await this.findByUserId(userId);
		if (!doc) {
			throw new Error('User categories document not found');
		}

		const trimmedOldName = oldName.trim();
		const trimmedNewName = newName.trim();

		if (!trimmedOldName || !trimmedNewName) {
			throw new Error('oldName and newName are required');
		}

		const targetIndex = doc.categories.findIndex((c) => c.name === trimmedOldName);
		if (targetIndex === -1) {
			throw new Error('Category not found');
		}

		if (doc.categories.some((c) => c.name === trimmedNewName)) {
			throw new Error('Category already exists');
		}

		const categories = doc.categories.map((c, index) => (index === targetIndex ? { ...c, name: trimmedNewName } : c));

		return this.updateOne({ userId }, { $set: { categories } });
	}
}
