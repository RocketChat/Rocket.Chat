import { test, expect } from '@playwright/test';

import MainContent from './utils/pageobjects/MainContent';
import SideNav from './utils/pageobjects/SideNav';
import LoginPage from './utils/pageobjects/LoginPage';
import { adminLogin } from './utils/mocks/userAndPasswordMock';

test.describe('[Emoji]', function () {
	let loginPage: LoginPage;
	let mainContent: MainContent;
	let sideNav: SideNav;

	test.beforeAll(async ({ browser, baseURL }) => {
		const context = await browser.newContext();
		const page = await context.newPage();
		const URL = baseURL as string;
		loginPage = new LoginPage(page);
		await loginPage.goto(URL);

		await loginPage.login(adminLogin);
		sideNav = new SideNav(page);
		mainContent = new MainContent(page);

		await sideNav.openChannel('general');
	});

	test.describe('Render:', () => {
		test.beforeAll(async () => {
			await mainContent.emojiBtn().click();
		});

		test.afterAll(async () => {
			await mainContent.emojiSmile().first().click();
			await mainContent.setTextToInput('');
		});

		test('expect show the emoji picker menu', async () => {
			await expect(mainContent.emojiPickerMainScreen()).toBeVisible();
		});

		test('expect click the emoji picker people tab', async () => {
			await mainContent.emojiPickerPeopleIcon().click();
		});

		test('expect show the emoji picker people tab', async () => {
			await expect(mainContent.emojiPickerPeopleIcon()).toBeVisible();
		});

		test('expect show the emoji picker nature tab', async () => {
			await expect(mainContent.emojiPickerNatureIcon()).toBeVisible();
		});

		test('expect show the emoji picker food tab', async () => {
			await expect(mainContent.emojiPickerFoodIcon()).toBeVisible();
		});

		test('expect show the emoji picker activity tab', async () => {
			await expect(mainContent.emojiPickerActivityIcon()).toBeVisible();
		});

		test('expect show the emoji picker travel tab', async () => {
			await expect(mainContent.emojiPickerTravelIcon()).toBeVisible();
		});

		test('expect show the emoji picker objects tab', async () => {
			await expect(mainContent.emojiPickerObjectsIcon()).toBeVisible();
		});

		test('expect show the emoji picker symbols tab', async () => {
			await expect(mainContent.emojiPickerSymbolsIcon()).toBeVisible();
		});

		test('expect show the emoji picker flags tab', async () => {
			await expect(mainContent.emojiPickerFlagsIcon()).toBeVisible();
		});

		test('expect show the emoji picker custom tab', async () => {
			await expect(mainContent.emojiPickerCustomIcon()).toBeVisible();
		});

		test('expect show the emoji picker change tone button', async () => {
			await expect(mainContent.emojiPickerChangeTone()).toBeVisible();
		});

		test('expect show the emoji picker search bar', async () => {
			await expect(mainContent.emojiPickerFilter()).toBeVisible();
		});
	});

	test.describe('[Usage]', () => {
		test.describe('send emoji via screen:', () => {
			test.beforeAll(async () => {
				await mainContent.emojiBtn().click();
				await mainContent.emojiPickerPeopleIcon().click();
			});

			test('expect select a grinning emoji', async () => {
				await mainContent.emojiGrinning().first().click();
			});

			test('expect be that the value on the message input is the same as the emoji clicked', async () => {
				await expect(mainContent.messageInput()).toHaveValue(':grinning: ');
			});

			test('expect send the emoji', async () => {
				await mainContent.addTextToInput(' ');
				await mainContent.getPage().keyboard.press('Enter');
			});

			test('expect be that the value on the message is the same as the emoji clicked', async () => {
				await expect(mainContent.lastMessage()).toContainText('😀');
			});
		});

		test.describe('send emoji via text:', () => {
			test('expect add emoji text to the message input', async () => {
				await mainContent.addTextToInput(':smiley');
			});

			test('expect show the emoji popup bar', async () => {
				await expect(mainContent.messagePopUp()).toBeVisible();
			});

			test('expect be that the emoji popup bar title is emoji', async () => {
				await expect(mainContent.messagePopUpTitle()).toContainText('Emoji');
			});

			test('expect show the emoji popup bar items', async () => {
				await expect(mainContent.messagePopUpItems()).toBeVisible();
			});

			test('expect click the first emoji on the popup list', async () => {
				await mainContent.messagePopUpFirstItem().click();
			});

			test('expect be that the value on the message input is the same as the emoji clicked', async () => {
				await expect(mainContent.messageInput()).toHaveValue(':smiley: ');
			});

			test('expect send the emoji', async () => {
				await mainContent.sendBtn().click();
			});

			test('expect be that the value on the message is the same as the emoji clicked', async () => {
				await expect(mainContent.lastMessage()).toContainText('😃');
			});
		});

		test.describe("send texts and make sure they're not converted to emojis:", () => {
			test('should render numbers', async () => {
				await mainContent.sendMessage('0 1 2 3 4 5 6 7 8 9');
				await mainContent.waitForLastMessageEqualsHtml('0 1 2 3 4 5 6 7 8 9');
			});
			test('should render special characters', async () => {
				await mainContent.sendMessage('# * ® © ™');
				await mainContent.waitForLastMessageEqualsHtml('# * ® © ™');
			});
		});
	});
});
