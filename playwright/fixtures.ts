import { test as baseTest } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export * from '@playwright/test';

const defaultAccount = {
	username: 'jon.doe',
	password: 'password123*R',
};

export const test = baseTest.extend<{}, { account: { username: string; password: string }; workerStorageState: string }>({
	// Use the same storage state for all tests in this worker.
	storageState: ({ workerStorageState }, use) => use(workerStorageState),
	account: [({}, use) => use(defaultAccount), { scope: 'worker' }],

	// Authenticate once per worker with a worker-scoped fixture.
	workerStorageState: [
		async ({ browser, account }, use) => {
			// Use parallelIndex as a unique identifier for each worker.
			const { parallelIndex } = test.info();

			const fileName = path.resolve(test.info().project.outputDir, `.auth/${account.username}/${parallelIndex}.json`);

			if (fs.existsSync(fileName)) {
				// Reuse existing authentication state if any.
				await use(fileName);
				return;
			}

			// Important: make sure we authenticate in a clean environment by unsetting storage state.
			const page = await browser.newPage({ storageState: undefined });

			// Acquire a unique account, for example create a new one.
			// Alternatively, you can have a list of precreated accounts for testing.
			// Make sure that accounts are unique, so that multiple team members
			// can run tests at the same time without interference.

			// await page.goto('http://localhost:3000/');
			// await page.getByRole('link', { name: 'Create an account' }).click();
			// await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Jon Doe');
			// await page.getByRole('textbox', { name: 'Email' }).fill('jon@doe.com');
			// await page.getByRole('textbox', { name: 'Username' }).fill('jon.doe');
			// await page.getByRole('textbox', { name: 'Password', exact: true }).fill('password123*R');
			// await page.getByRole('textbox', { name: 'Confirm your password' }).fill('password123*R');
			// await page.getByRole('button', { name: 'Join your team' }).click();

			// Perform authentication steps. Replace these actions with your own.
			await page.goto('http://localhost:3000/login');
			await page.getByRole('textbox', { name: 'Email or username' }).fill(account.username);
			await page.getByRole('textbox', { name: 'Password' }).fill(account.password);
			await page.getByRole('button', { name: 'Login' }).click();
			// Wait until the page receives the cookies.
			//
			// Sometimes login flow sets cookies in the process of several redirects.
			// Wait for the final URL to ensure that the cookies are actually set.
			await page.waitForURL('http://localhost:3000/home');
			await page.waitForFunction(() => localStorage.getItem('Meteor.loginToken') !== null);
			// Alternatively, you can wait until the page reaches a state where all cookies are set.
			// await expect(page).toHaveTitle(/Login - Rocket.Chat/);

			// End of authentication steps.

			await page.context().storageState({ path: fileName, indexedDB: true });
			await page.close();
			await use(fileName);
		},
		{ scope: 'worker' },
	],
});
