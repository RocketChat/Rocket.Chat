import { capitalize } from '@rocket.chat/tools';
import type { NextFunction, Request, Response } from 'express';

import { settings } from '../../settings';

export const allowPassportOAuthMiddleware =
	(service: string, isCustomOAuth: boolean = false) =>
	(_req: Request, _res: Response, next: NextFunction) => {
		const settingPrefix = `${isCustomOAuth ? 'Accounts_OAuth_Custom-' : 'Accounts_OAuth_'}`;
		const isOAuthServiceEnabled = settings.get<boolean>(`${settingPrefix}${capitalize(service)}`);

		if (!isOAuthServiceEnabled) {
			next('router');
		} else {
			next();
		}
	};
