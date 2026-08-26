import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { setSettingValueById } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

/**
 * The caller's side of the flow `VideoConf_Conference_Window_Enabled` turns on.
 *
 * `video-conference-ring.spec.ts` is the proof the setting leaves the old flow alone — the caller waits in the
 * room, in a "Calling …" popup, until the callee answers. This is the proof of what replaces it: the call window
 * opens on the click that asked for it (which is what gives `window.open` the user activation browsers are
 * entitled to demand), and the room stops asking anything, because the preflight in that window is where the
 * camera is chosen and where confirming is what actually creates the call.
 *
 * It stops at the window opening. Everything past the preflight — the ring, the decline, calling again — happens
 * inside that window, and belongs with the page objects for it rather than here.
 */
test.describe('video conference call window', () => {
	let poHomeChannel: HomeChannel;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'VideoConf_Conference_Window_Enabled', true);
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'VideoConf_Conference_Window_Enabled', false);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);

		await page.goto('/home');
	});

	test('should open the call in its own window instead of asking in the room', async ({ page }) => {
		await poHomeChannel.navbar.openChat('user2');

		const callWindow = page.context().waitForEvent('page');

		await poHomeChannel.content.btnVideoCall.click();

		await test.step('opens a window on the conference route', async () => {
			const opened = await callWindow;
			await expect(opened).toHaveURL(/\/conference\/new\?.*rid=/);
		});

		await test.step('asks nothing in the room', async () => {
			// Neither the popup that used to ask about mic and camera, nor the one that used to hold the wait: the
			// window does both now.
			await expect(poHomeChannel.content.getVideoConfPopup('Start a call with user2')).not.toBeVisible();
			await expect(poHomeChannel.content.getVideoConfPopup('Calling user2')).not.toBeVisible();
		});

		await (await callWindow).close();
	});
});
