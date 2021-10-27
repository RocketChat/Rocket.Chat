import type { IRoom } from '../../IRoom';
import type { IUser } from '../../IUser';

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
