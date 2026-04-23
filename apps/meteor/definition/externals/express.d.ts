import 'express';

import type { IUser } from '@rocket.chat/core-typings';

declare module 'express' {
	interface Request {
		userId?: string;
		user?: IUser;
		unauthorized?: boolean;
	}
}
declare global {
	namespace Express {
		//eslint-disable-next-line
		interface User extends IUser {}
	}
}
