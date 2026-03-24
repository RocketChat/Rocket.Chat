import type { IUserRoomCategories } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IUserRoomCategoriesModel extends IBaseModel<IUserRoomCategories> {
	findByUserId(userId: string): Promise<IUserRoomCategories | null>;

	createCategory(userId: string, name: string): Promise<UpdateResult>;
	addRoomToCategory(userId: string, categoryName: string, roomId: string): Promise<UpdateResult>;
	removeRoomFromCategory(userId: string, categoryName: string, roomId: string): Promise<UpdateResult>;
	removeCategory(userId: string, name: string): Promise<UpdateResult>;
}
