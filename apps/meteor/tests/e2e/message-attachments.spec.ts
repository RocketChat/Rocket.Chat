import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannel, deleteChannel } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

const createCodeBlock = (text: string, language = '') => {
	return `\`\`\`${language}\n${text}\n\`\`\``;
};

test.describe('message-attachments', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;

	test.beforeAll(async ({ api }) => {
		targetChannel = await createTargetChannel(api);
		await api.post('/chat.postMessage', {
			channel: targetChannel,
			attachments: [{ text: createCodeBlock('TEST_START > TEST_END') }],
		});
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test.afterAll(({ api }) => deleteChannel(api, targetChannel));

	test('should show correct message with attachments', async ({ page }) => {
		await poHomeChannel.sidenav.openChat(targetChannel);
		await expect(page.getByText('TEST_START > TEST_END')).toBeVisible();
	});
});
