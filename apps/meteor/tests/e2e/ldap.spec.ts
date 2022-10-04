import path from 'path';

import { test, expect } from '@playwright/test';
import type { StartedTestContainer } from 'testcontainers';
import { GenericContainer } from 'testcontainers';

test.describe.only('ldap test', async () => {
	let container: StartedTestContainer;
	test.beforeAll(async () => {
		const buildContext = path.resolve(__dirname, 'fixtures', 'ldap-client');

		container = await (await GenericContainer.fromDockerfile(buildContext).build())
			.withName('ldap')
			.withExposedPorts({ container: 10389, host: 389 })
			.start();
	});

	test.afterAll(async () => {
		await container.stop();
	});

	test('something testing', async ({ page }) => {
		await page.goto('/');
		await page.pause();
		console.log(container);
		expect(1).toEqual(1);
	});
});
