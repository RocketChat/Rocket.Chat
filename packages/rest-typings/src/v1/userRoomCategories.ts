import type { IUserRoomCategory } from '@rocket.chat/core-typings';

export type UserRoomCategoriesEndpoints = {
	'/v1/user-room-categories': {
		GET: () => { categories: IUserRoomCategory[] };

		POST: (params: { name: string }) => void;
	};

	'/v1/user-room-categories/add-room': {
		POST: (params: { categoryName: string; roomId: string }) => void;
	};

	'/v1/user-room-categories/remove-room': {
		POST: (params: { categoryName: string; roomId: string }) => void;
	};

	'/v1/user-room-categories/remove-category': {
		POST: (params: { name: string }) => void;
	};

	'/v1/user-room-categories/rename-category': {
		POST: (params: { oldName: string; newName: string }) => void;
	};
};
