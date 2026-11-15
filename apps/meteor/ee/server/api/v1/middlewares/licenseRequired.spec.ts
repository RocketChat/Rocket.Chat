import type { LicenseManager } from '@rocket.chat/license';
import type { Context } from 'hono';

import { licenseRequired } from './licenseRequired';
import type { TypedOptions } from '../../../../../server/api/definition';

const run = async (options: Partial<TypedOptions>, hasValidLicense: boolean) => {
	const licenseManager = { hasValidLicense: () => hasValidLicense } as unknown as LicenseManager;
	const c = { json: jest.fn((body, status) => ({ body, status })) } as unknown as Context;
	const next = jest.fn();

	const result = await licenseRequired(options as TypedOptions, licenseManager)(c, next);

	return { c, next, result };
};

describe('licenseRequired middleware', () => {
	it('passes through when the endpoint does not require a license', async () => {
		const { next, c } = await run({}, false);

		expect(next).toHaveBeenCalled();
		expect(c.json).not.toHaveBeenCalled();
	});

	it('passes through when the workspace has a valid license', async () => {
		const { next, c } = await run({ licenseRequired: true }, true);

		expect(next).toHaveBeenCalled();
		expect(c.json).not.toHaveBeenCalled();
	});

	it('rejects with error-action-not-allowed when the workspace has no valid license', async () => {
		const { next, result } = await run({ licenseRequired: true }, false);

		expect(next).not.toHaveBeenCalled();
		expect(result).toEqual({
			status: 400,
			body: {
				success: false,
				error: 'This is an enterprise feature [error-action-not-allowed]',
				errorType: 'error-action-not-allowed',
			},
		});
	});
});
