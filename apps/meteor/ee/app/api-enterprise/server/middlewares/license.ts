import type { License } from '@rocket.chat/license';
import type { Request, Response, NextFunction } from 'express';

import type { FailureResult, TypedOptions } from '../../../../../app/api/server/definition';

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;

// TODO: use interface instead of `typeof License`
export const license =
	(options: TypedOptions, licenseManager: typeof License): ExpressMiddleware =>
	async (_req, res, next) => {
		if (!options.license) {
			return next();
		}

		const license = options.license.every((license) => licenseManager.hasModule(license));

		const failure: FailureResult<{
			error: string;
			errorType: string;
		}> = {
			statusCode: 400,
			body: {
				success: false,
				error: 'This is an enterprise feature [error-action-not-allowed]',
				errorType: 'error-action-not-allowed',
			},
		};

		if (!license) {
			return res.status(failure.statusCode).json(failure.body);
		}

		return next();
	};
