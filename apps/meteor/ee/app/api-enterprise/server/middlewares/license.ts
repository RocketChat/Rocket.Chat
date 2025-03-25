import { License } from '@rocket.chat/license';
import type { Request, Response, NextFunction } from 'express';

import type { TypedOptions } from '../../../../../app/api/server/definition';

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export const license =
	(options: TypedOptions): ExpressMiddleware =>
	async (_req, res, next) => {
		if (!options.license) {
			return next();
		}

		const license = options.license.every((license) => License.hasModule(license));
		if (!license) {
			return res.status(404).json('404 Not Found');
		}

		return next();
	};
