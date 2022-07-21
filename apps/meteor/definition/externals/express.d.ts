import 'express';

import { IUser } from '@rocket.chat/core-typings';

declare module 'express' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	export interface Request {
		userId?: string;
		user?: IUser;
	}
}
