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
		// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type -- merges with Passport's Express.User
		interface User extends IUser {}
	}
}
