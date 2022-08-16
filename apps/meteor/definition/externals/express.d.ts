import 'express';

import type { IUser } from '@rocket.chat/core-typings';

declare module 'express' {
	export interface Request {
		userId?: string;
		user?: IUser;
	}
}
