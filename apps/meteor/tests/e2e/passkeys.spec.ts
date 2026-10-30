import type { Browser } from '@playwright/test';

import { DEFAULT_USER_CREDENTIALS } from './config/constants';
import { AccountPasskeys, AccountProfile, Authenticated, Login } from './page-objects';
import { setSettingValueById } from './utils';
import { test, expect } from './utils/test';
import type { ITestUser } from './utils/user-helpers';
import { createTestUser, loginTestUser } from './utils/user-helpers';
import { addVirtualAuthenticator } from './utils/virtualAuthenticator';

type VirtualCredential = Awaited<ReturnType<Awaited<ReturnType<typeof addVirtualAuthenticator>>['getCredentials']>>[number];

/** Opens the login page in a session that has never signed in, on a device that holds `credential`. */
const openLoginOnAnotherDevice = async (browser: Browser, credential: VirtualCredential) => {
	const context = await browser.newContext();
	const page = await context.newPage();
	await (await addVirtualAuthenticator(page)).addCredential(credential);

	const poLogin = new Login(page);
	await poLogin.goto();

	return { context, page, poLogin };
};

test.describe.serial('passkeys', () => {
	let user: ITestUser;

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_Passkeys_Enabled', true);
		user = await createTestUser(api);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'Accounts_Passkeys_Enabled', false);
		await user.delete();
	});

	test('a user adds a passkey, signs in with it on another device, and removes it', async ({ browser, api }) => {
		const accountContext = await browser.newContext({ storageState: (await loginTestUser(api, user)).state });
		const accountPage = await accountContext.newPage();
		const authenticator = await addVirtualAuthenticator(accountPage);
		const poAccountPasskeys = new AccountPasskeys(accountPage);
		let credential: VirtualCredential;

		try {
			await test.step('add a passkey after confirming the password, and name it', async () => {
				await poAccountPasskeys.goto();
				await expect(poAccountPasskeys.textNoPasskeys).toBeVisible();

				await poAccountPasskeys.addPasskey('Work laptop', DEFAULT_USER_CREDENTIALS.password);

				await expect(poAccountPasskeys.getPasskeyRow('Work laptop')).toContainText('Never');
				[credential] = await authenticator.getCredentials();
			});

			await test.step('see what kind of passkey it is and where it was added from', async () => {
				await poAccountPasskeys.openPasskey('Work laptop');

				await expect(poAccountPasskeys.details.root).toContainText('Built into a device');
				await expect(poAccountPasskeys.details.root).toContainText('Added from');
				await expect(poAccountPasskeys.details.root).not.toContainText('Last used from');
			});

			await test.step('rename it', async () => {
				await poAccountPasskeys.renamePasskey('Work laptop', 'Personal laptop');
			});

			await test.step('sign in with it from the login page of another device, without a password', async () => {
				const { context, page, poLogin } = await openLoginOnAnotherDevice(browser, credential);

				try {
					await poLogin.form.btnLoginWithPasskey.click();
					await new Authenticated(page).waitForDisplay();
				} finally {
					await context.close();
				}
			});

			await test.step('see when, and from where, it was last used', async () => {
				await poAccountPasskeys.goto();
				await expect(poAccountPasskeys.getPasskeyRow('Personal laptop')).not.toContainText('Never');

				await poAccountPasskeys.openPasskey('Personal laptop');
				await expect(poAccountPasskeys.details.root).toContainText('Last used from');
			});

			await test.step('remove it, after which it no longer signs in', async () => {
				await poAccountPasskeys.removePasskey('Personal laptop');

				const { context, poLogin } = await openLoginOnAnotherDevice(browser, credential);

				try {
					await poLogin.form.btnLoginWithPasskey.click();
					await expect(poLogin.form.textPasskeyCannotSignIn).toBeVisible();
				} finally {
					await context.close();
				}
			});
		} finally {
			await accountContext.close();
		}
	});

	test('the account menu offers the passkeys page only while passkeys are enabled', async ({ browser, api }) => {
		const context = await browser.newContext({ storageState: (await loginTestUser(api, user)).state });
		const poAccountProfile = new AccountProfile(await context.newPage());

		try {
			await poAccountProfile.goto();
			await expect(poAccountProfile.sidebar.linkPasskeys).toBeVisible();

			await setSettingValueById(api, 'Accounts_Passkeys_Enabled', false);
			await poAccountProfile.goto();
			await expect(poAccountProfile.sidebar.linkPasskeys).not.toBeVisible();
		} finally {
			await setSettingValueById(api, 'Accounts_Passkeys_Enabled', true);
			await context.close();
		}
	});

	test('the login page offers passkeys only while they are enabled, without accessibility violations', async ({
		page,
		api,
		makeAxeBuilder,
	}) => {
		const poLogin = new Login(page);

		try {
			await poLogin.goto();
			await expect(poLogin.form.btnLoginWithPasskey).toBeVisible();
			expect((await makeAxeBuilder().analyze()).violations).toEqual([]);

			await setSettingValueById(api, 'Accounts_Passkeys_Enabled', false);
			await expect(poLogin.form.btnLoginWithPasskey).not.toBeVisible();
		} finally {
			await setSettingValueById(api, 'Accounts_Passkeys_Enabled', true);
		}
	});
});
