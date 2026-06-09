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

		try {
			return await this.updateOne(
				{ userId, 'categories.name': { $ne: trimmedName } },
				{
					$push: {
						categories: {
							$each: [{ name: trimmedName, roomIds: [] }],
							$position: 0,
						},
					},
					$setOnInsert: { userId },
				},
				{ upsert: true },
			);
		} catch (error: any) {
			if (error?.code === 11000) {
				throw new Error('Category already exists');
			}
			throw error;
		}
	}

	async addRoomToCategory(userId: string, categoryName: string, roomId: string): Promise<UpdateResult> {
		const trimmedCategoryName = categoryName.trim();
		const trimmedRoomId = roomId.trim();

		const result = await this.updateOne(
			{ userId, 'categories.name': trimmedCategoryName },
			{
				$addToSet: { 'categories.$[target].roomIds': trimmedRoomId },
				$pull: { 'categories.$[other].roomIds': trimmedRoomId },
			},
			{
				arrayFilters: [{ 'target.name': trimmedCategoryName }, { 'other.name': { $ne: trimmedCategoryName } }],
			},
		);

		if (result.matchedCount === 0) {
			throw new Error('Category not found');
		}

		return result;
	}

	async removeRoomFromCategory(userId: string, categoryName: string, roomId: string): Promise<UpdateResult> {
		const trimmedCategoryName = categoryName.trim();
		const trimmedRoomId = roomId.trim();

		const result = await this.updateOne(
			{ userId, 'categories.name': trimmedCategoryName },
			{ $pull: { 'categories.$.roomIds': trimmedRoomId } },
		);

		if (result.matchedCount === 0) {
			throw new Error('Category not found');
		}

		return result;
	}

	async removeCategory(userId: string, name: string): Promise<UpdateResult> {
		const trimmedName = name.trim();

		return this.updateOne({ userId }, { $pull: { categories: { name: trimmedName } } });
	}

	async renameCategory(userId: string, oldName: string, newName: string): Promise<UpdateResult> {
		const trimmedOldName = oldName.trim();
		const trimmedNewName = newName.trim();

		if (!trimmedOldName || !trimmedNewName) {
			throw new Error('oldName and newName are required');
		}

		const result = await this.updateOne(
			{
				userId,
				'categories.name': trimmedOldName,
				categories: { $not: { $elemMatch: { name: trimmedNewName } } },
			},
			{ $set: { 'categories.$.name': trimmedNewName } },
		);

		if (result.matchedCount === 0) {
			const doc = await this.findByUserId(userId);
			if (!doc) {
				throw new Error('User categories document not found');
			}
			if (doc.categories.some((c) => c.name === trimmedNewName)) {
				throw new Error('Category already exists');
			}
			throw new Error('Category not found');
		}

		return result;
	}
}
