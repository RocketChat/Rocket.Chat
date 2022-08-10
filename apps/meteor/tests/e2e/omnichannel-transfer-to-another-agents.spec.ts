import { test, expect } from './utils/test';
import { OmnichannelLivechat } from './page-objects';

test.describe('omnichannel-departaments', () => {
	test.beforeEach(async ({ page, api }) => {
		await page.goto('/');
		poHomeChannel = new HomeChannel(page);

		await api.post('/livechat/users/agent', { username: 'user1' });
	});

	test('expect transfer chat to another agent', async () => {});
});
