import type { IRoom, IUser } from '@rocket.chat/core-typings';

export type DmEndpoints = {
	'dm.create': {
		POST: (
			params: (
				| {
						username: Exclude<IUser['username'], undefined>;
				  }
				| {
						usernames: string;
				  }
			) & {
				excludeSelf?: boolean;
			},
		) => {
			room: IRoom & { rid: IRoom['_id'] };
		};
	};
};
