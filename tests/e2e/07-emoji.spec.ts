import { test, expect } from '@playwright/test';

import MainContent from './utils/pageobjects/main-content.page';
import SideNav from './utils/pageobjects/side-nav.page';
import LoginPage from './utils/pageobjects/login.page';
import { adminLogin } from './utils/mocks/userAndPasswordMock';
import { LOCALHOST } from './utils/mocks/urlMock';
import mainContent from "/tests/cypress/pageobjects/main-content.page";
import sideNav from "/tests/cypress/pageobjects/side-nav.page";

test.describe('[Emoji]', function () {
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;

	test.beforeAll(async ({ browser, baseURL }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		const URL = baseURL || LOCALHOST;
		loginPage = new LoginPage(page);
		await loginPage.goto(URL);

		await loginPage.login(adminLogin);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);

		await sideNav.spotlightSearchIcon().click();
		await sideNav.searchChannel('general');
	});

	test.describe('Render:', () => {
		before(async () => {
			await mainContent.emojiBtn().click();
		});

		after(async () => {
			await mainContent.emojiSmile().first().click();
			await mainContent.setTextToInput('');
		});

		test('it should show the emoji picker menu', async () => {
			await expect(mainContent.emojiPickerMainScreen()).toBeVisible();
		});

		test('it should click the emoji picker people tab', async () => {
			await mainContent.emojiPickerPeopleIcon().click();
		});

		test('it should show the emoji picker people tab', async () => {
			await expect(mainContent.emojiPickerPeopleIcon()).toBeVisible();
		});

		test('it should show the emoji picker nature tab', async () => {
			await expect(mainContent.emojiPickerNatureIcon()).toBeVisible();
		});

		test('it should show the emoji picker food tab', async () => {
			await expect(mainContent.emojiPickerFoodIcon()).toBeVisible();
		});

		test('it should show the emoji picker activity tab', async () => {
			await expect(mainContent.emojiPickerActivityIcon()).toBeVisible();
		});

		test('it should show the emoji picker travel tab', async () => {
			await expect(mainContent.emojiPickerTravelIcon()).toBeVisible();
		});

		test('it should show the emoji picker objects tab', async () => {
			await expect(mainContent.emojiPickerObjectsIcon()).toBeVisible();
		});

		test('it should show the emoji picker symbols tab', async () => {
			await expect(mainContent.emojiPickerSymbolsIcon()).toBeVisible();
		});

		test('it should show the emoji picker flags tab', async () => {
			await expect(mainContent.emojiPickerFlagsIcon()).toBeVisible();
		});

		test('it should show the emoji picker custom tab', async () => {
			await expect(mainContent.emojiPickerCustomIcon()).toBeVisible();
		});

		test('it should show the emoji picker change tone button', async () => {
			await expect(mainContent.emojiPickerChangeTone()).toBeVisible();
		});

		test('it should show the emoji picker search bar', async () => {
			await expect(mainContent.emojiPickerFilter()).toBeVisible();
		});
	});

	test.describe('[Usage]', () => {
		test.describe('send emoji via screen:', () => {
			test.beforeAll(async () => {
				await mainContent.emojiBtn().click();
				await mainContent.emojiPickerPeopleIcon().click();
			});

			test('it should select a grinning emoji', async () => {
				await mainContent.emojiGrinning().first().click();
			});

			test('it should be that the value on the message input is the same as the emoji clicked', async () => {
				await mainContent.messageInput().should('have.value', ':grinning: ');
			});

			test('it should send the emoji', async () => {
				await mainContent.addTextToInput(' ');
				await mainContent.sendBtn().click();
			});

			test('it should be that the value on the message is the same as the emoji clicked', async () => {
				await expect(mainContent.lastMessage()).toContainText('😀');
			});
		});

		test.describe('send emoji via text:', () => {
			test('it should add emoji text to the message input', async () => {
				await mainContent.addTextToInput(':smile');
			});

			test('it should show the emoji popup bar', async () => {
				await expect(mainContent.messagePopUp()).toBeVisible();
			});

			test('it should be that the emoji popup bar title is emoji', async () => {
				await expect(mainContent.messagePopUpTitle()).toContainText('Emoji');
			});

			test('it should show the emoji popup bar items', async () => {
				await expect(mainContent.messagePopUpItems()).toBeVisible();
			});

			test('it should click the first emoji on the popup list', async () => {
				await mainContent.messagePopUpFirstItem().click();
			});

			test('it should be that the value on the message input is the same as the emoji clicked', async () => {
				await expect(mainContent.messageInput()).toHaveValue(':smile: ');
			});

			test('it should send the emoji', async () => {
				await mainContent.sendBtn().click();
			});

			test('it should be that the value on the message is the same as the emoji clicked', async () => {
				await expect(mainContent.lastMessage()).toContainText('😄');
			});
		});

		test.describe("send texts and make sure they're not converted to emojis:", () => {
			test('should render numbers', () => {
				mainContent.sendMessage('0 1 2 3 4 5 6 7 8 9');
				mainContent.waitForLastMessageEqualsHtml('0 1 2 3 4 5 6 7 8 9');
			});

			test('should render special characters', () => {
				mainContent.sendMessage('# * ® © ™');
				mainContent.waitForLastMessageEqualsHtml('# * ® © ™');
			});
		});
	});
});
