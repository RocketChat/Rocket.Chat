import { capitalize } from '@rocket.chat/string-helpers';
import type { NextFunction, Request, Response } from 'express';

import { settings } from '../../../app/settings/server';

export const allowPassportOAuthMiddleware =
	(service: string, isCustomOAuth: boolean = false) =>
	(_req: Request, _res: Response, next: NextFunction) => {
		const isPassportFlowEnabled = settings.get<boolean>('Accounts_OAuth_Use_Modern_Flow');
		const isOAuthServiceEnabled = settings.get<boolean>(
			`${isCustomOAuth ? 'Accounts_OAuth_Custom-' : 'Accounts_OAuth_'}${capitalize(service)}`,
		);

		if (!isPassportFlowEnabled || !isOAuthServiceEnabled) {
			next('router');
		} else {
			next();
		}
	};
