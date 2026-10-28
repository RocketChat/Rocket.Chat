import type { LicenseManager } from '@rocket.chat/license';
import type { MiddlewareHandler } from 'hono';

import type { FailureResult, TypedOptions } from '../../../../../server/api/definition';

export const licenseRequired =
	(options: TypedOptions, licenseManager: LicenseManager): MiddlewareHandler =>
	async (c, next) => {
		if (!options.licenseRequired || licenseManager.hasValidLicense()) {
			return next();
		}

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

		return c.json(failure.body, failure.statusCode);
	};
