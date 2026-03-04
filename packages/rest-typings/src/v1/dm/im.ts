import type { IRoom } from '@rocket.chat/core-typings';

type DmCreateProps = (
	| {
		usernames: string;
	}
	| {
		username: string;
	}
) & { excludeSelf?: boolean };


export type ImEndpoints = {
	'/v1/im.create': {
		POST: (params: DmCreateProps) => {
			room: IRoom & { rid: IRoom['_id'] };
		};
	};
};
