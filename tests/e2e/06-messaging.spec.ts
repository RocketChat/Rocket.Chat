import { expect, test } from '@playwright/test';

// import MainContent from './utils/pageobjects/main-content.page';
// import SideNav from './utils/pageobjects/side-nav.page';
// import FlexTab from './utils/pageobjects/flex-tab.page';
import LoginPage from './utils/pageobjects/login.page';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

// // TODO: will be implemented soon
test.describe('[Messaging]', () => {
	let loginPage: LoginPage;
	// let mainContent: MainContent;
	// let sideNav: SideNav;
	// let flexTab: FlexTab;

	const message = 'any_message';
	test.beforeAll(async ({ browser, baseURL }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		loginPage = new LoginPage(page);
		// mainContent = new MainContent(page);
		// sideNav = new SideNav(page);
		// flexTab = new FlexTab(page);
		await loginPage.goto(baseURL as string);
		await loginPage.login(adminLogin);
	});
	test('1 to be 1', () => {
		expect(typeof message).toBe('string');
	});
	// test.describe('[Normal message]', () => {
	// 	test('expect send message to a public channel', async () => {
	// 		await textInput.type(message);
	// 		await expect(messageComponent).toHaveText(message);
	// 	});
	// 	test('expect send message to a private channel channel', async () => {
	// 		await textInput.type(message);
	// 		await expect(messageComponent).toHaveText(message);
	// 	});

	// 	test('expect send message to a private conversation', async () => {
	// 		await textInput.type(message);
	// 		await expect(messageComponent).toHaveText(message);
	// 	});
	// 	test('expect send message to a general ', async () => {
	// 		await textInput.type(message);
	// 		await expect(messageComponent).toHaveText(message);
	// 	});
	// });

	// test.describe('[File upload]', async () => {
	// 	test.beforeEach(async () => {
	// 		// put file
	// 	});

	// 	test('expect show file preview', async () => {});

	// 	test('expect cancel send file success', async () => {});
	// 	test('expect send file success', async () => {});
	// 	test('expect show file in conversation', async () => {});
	// });

	// test.describe('[Actions]', async () => {
	// 	test.beforeAll(async () => {
	// 		// send message
	// 	});

	// 	test('');
	// });
});
