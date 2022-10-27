import type { Page } from '@playwright/test';
import { chromium } from '@playwright/test';

require('util').inspect.defaultOptions.depth = null;

export default async function (): Promise<void> {
	const browser = await chromium.launch();

	const requiredEnvVars = [
		'RC_SERVER_1',
		'RC_SERVER_2',
		'RC_SERVER_1_ADMIN_USER',
		'RC_SERVER_1_ADMIN_PASSWORD',
		'RC_SERVER_2_ADMIN_USER',
		'RC_SERVER_2_ADMIN_PASSWORD',
	];

	if (requiredEnvVars.some((envVar) => !process.env[envVar])) {
		throw new Error(`Missing required environment variables: ${requiredEnvVars.filter((envVar) => !process.env[envVar]).join(', ')}`);
	}

	await browser.close();
}
