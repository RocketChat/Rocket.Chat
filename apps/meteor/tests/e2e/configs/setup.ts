import type { IRoom, IUser, ISubscription } from '@rocket.chat/core-typings';
import { chromium } from '@playwright/test';

import { MongoHelper } from '../utils/MongoHelper';
import { URL_MONGODB, ADMIN_CREDENTIALS, BASE_URL } from '../utils/constants';
import { roomMock } from '../utils/mocks/roomMock';
import { userMock } from '../utils/mocks/userMock';
import { subscriptionMock } from '../utils/mocks/subscriptionMock';

const insertRoom = async (): Promise<void> => {
	const roomCollection = await MongoHelper.getCollection<IRoom>('rocketchat_room');
	await roomCollection.insertMany(roomMock);
};

const insertUser = async (): Promise<void> => {
	const userCollection = await MongoHelper.getCollection<IUser>('users');
	await userCollection.insertOne(userMock);
};

const subscribeUserInChannels = async (): Promise<void> => {
	const subscribeCollections = await MongoHelper.getCollection<ISubscription>('rocketchat_subscription');
	await subscribeCollections.insertMany(subscriptionMock);
};

export default async (): Promise<void> => {
	await MongoHelper.connect(URL_MONGODB);
	await insertRoom();
	await insertUser();
	await subscribeUserInChannels();
	await MongoHelper.disconnect();

	const browser = await chromium.launch();
	const page = await browser.newPage();

	await page.goto(BASE_URL);

	await page.locator('[name=emailOrUsername]').type(ADMIN_CREDENTIALS.email);
	await page.locator('[name=pass]').type(ADMIN_CREDENTIALS.password);
	await page.locator('.login').click();

	await page.locator('[name="organizationName"]').type('any_name');
	await page.locator('[name="organizationType"]').click();
	await page.locator('.rcx-options .rcx-option:first-child >> text="Community"').click();
	await page.locator('[name="organizationIndustry"]').click();
	await page.locator('.rcx-options .rcx-option:first-child >> text="Aerospace & Defense"').click();
	await page.locator('[name="organizationSize"]').click();
	await page.locator('.rcx-options .rcx-option:first-child >> text="1-10 people"').click();
	await page.locator('[name="country"]').click();
	await page.locator('.rcx-options .rcx-option:first-child >> text="Afghanistan"').click();
	await page.locator('.rcx-button--primary.rcx-button >> text="Next"').click();

	await page.locator('a.rcx-box.rcx-box--full >> text="Continue as standalone"').click();

	await page.locator('.rcx-button--primary.rcx-button >> text="Confirm"').click();

	await page.waitForURL('http://localhost:3000/home');
	await browser.close();
};
