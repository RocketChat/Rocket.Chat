import type { LicenseManager } from '@rocket.chat/license';
import type { Request, Response, NextFunction } from 'express';

import type { FailureResult, TypedOptions } from '../../../../../app/api/server/definition';

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export const license =
	(options: TypedOptions, licenseManager: LicenseManager): ExpressMiddleware =>
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
			// Explicitly set the content type to application/json to avoid the following issue:
			// https://github.com/expressjs/express/issues/2238
			res.writeHead(failure.statusCode, { 'Content-Type': 'application/json' });
			res.write(JSON.stringify(failure.body));
			return res.end();
		}

		return next();
	};
