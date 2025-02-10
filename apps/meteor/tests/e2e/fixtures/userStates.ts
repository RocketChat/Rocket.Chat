import crypto from 'crypto';

import type { BrowserContextOptions, Page } from '@playwright/test';

import { BASE_URL } from '../config/constants';

export type IUserState = {
	data: {
		username: string;
		loginToken: string;
		loginExpire: Date;
		hashedToken: string;
	};
	state: Exclude<BrowserContextOptions['storageState'], string | undefined>;
};

function generateContext(username: string): IUserState {
	const date = new Date();
	date.setFullYear(date.getFullYear() + 1);

	const token = {
		token: crypto.createHash('sha256').update(username).digest('base64'),
		when: date,
	};

	const hashedToken = crypto.createHash('sha256').update(token.token).digest('base64');

	return {
		data: {
			username,
			loginToken: token.token,
			loginExpire: token.when,
			hashedToken,
		},
		state: {
			cookies: [
				{
					sameSite: 'Lax',
					name: 'rc_uid',
					value: username,
					domain: 'localhost',
					path: '/',
					expires: -1,
					httpOnly: false,
					secure: false,
				},
				{
					sameSite: 'Lax',
					name: 'rc_token',
					value: token.token,
					domain: 'localhost',
					path: '/',
					expires: -1,
					httpOnly: false,
					secure: false,
				},
			],
			origins: [
				{
					origin: BASE_URL,
					localStorage: [
						{
							name: 'userLanguage',
							value: 'en-US',
						},
						{
							name: 'Meteor.loginToken',
							value: token.token,
						},
						{
							name: 'Meteor.loginTokenExpires',
							value: token.when.toISOString(),
						},
						{
							name: 'Meteor.userId',
							value: username,
						},
					],
				},
			],
		},
	};
}

export const Users = {
	user1: generateContext('user1'),
	user2: generateContext('user2'),
	user3: generateContext('user3'),
	samluser1: generateContext('samluser1'),
	samluser2: generateContext('samluser2'),
	userForSamlMerge: generateContext('user_for_saml_merge'),
	userForSamlMerge2: generateContext('user_for_saml_merge2'),
	admin: generateContext('rocketchat.internal.admin.test'),
};

export async function storeState(page: Page, user: IUserState) {
	user.state.origins = (await page.context().storageState()).origins;
}

export async function restoreState(page: Page, user: IUserState, options: { except?: string[] } = {}) {
	let ls = user.state.origins[0].localStorage;
	if (options.except?.length) {
		ls = ls.filter(({ name }) => !options.except?.includes(name));
	}

	await page.evaluate((items) => {
		items.forEach(({ name, value }) => {
			window.localStorage.setItem(name, value);
		});
	}, ls);

	await page.waitForTimeout(2000); // Wait for the login to be completed
}
