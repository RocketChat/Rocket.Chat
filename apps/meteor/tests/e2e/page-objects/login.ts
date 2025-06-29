import type { Page } from '@playwright/test';
import type { IUser } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';

import * as constants from '../config/constants';
import type { IUserState } from '../fixtures/userStates';
import { expect } from '../utils/test';

export class LoginPage {
	constructor(protected readonly page: Page) {}

	get loginButton() {
		return this.page.getByRole('button', { name: 'Login' });
	}

	/** @deprecated ideally the previous action should ensure the user is logged out and we should just assume to be at the login page */
	async waitForIt() {
		await this.loginButton.waitFor();
	}

	protected async waitForLogin() {
		await expect(this.loginButton).not.toBeVisible();
	}

	async loginByUserState(userState: IUserState) {
		// Creates a login token for the user
		const connection = await MongoClient.connect(constants.URL_MONGODB);

		await connection
			.db()
			.collection<IUser>('users')
			.updateOne(
				{ username: userState.data.username },
				{ $addToSet: { 'services.resume.loginTokens': { when: userState.data.loginExpire, hashedToken: userState.data.hashedToken } } },
			);

		await connection.close();

		// Injects the login token to the local storage
		await this.page.evaluate((items) => {
			items.forEach(({ name, value }) => {
				window.localStorage.setItem(name, value);
			});
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			require('meteor/accounts-base').Accounts._pollStoredLoginToken();
		}, userState.state.origins[0].localStorage);

		await this.waitForLogin();
	}
}
