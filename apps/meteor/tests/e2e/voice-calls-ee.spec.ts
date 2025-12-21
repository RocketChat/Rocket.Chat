import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { expect, test } from './utils/test';

test.describe('Internal Voice Calls - Enterprise Edition', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');
	let sessions: { page: Page; poHomeChannel: HomeChannel }[];

	test.beforeAll(async ({ api }) => {
		await Promise.all([
			api.post('/users.setStatus', { status: 'online', username: 'user1' }),
			api.post('/users.setStatus', { status: 'online', username: 'user2' }),
		]);
	});

	test.beforeAll(async ({ browser }) => {
		sessions = await Promise.all([
			createAuxContext(browser, Users.user1).then(({ page }) => ({ page, poHomeChannel: new HomeChannel(page) })),
			createAuxContext(browser, Users.user2).then(({ page }) => ({ page, poHomeChannel: new HomeChannel(page) })),
		]);
	});

	test('should initiate voice call from direct message', async () => {
		const [user1, user2] = sessions;

		await test.step('should open direct message with user2', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.content.inputMessage).toBeVisible();
		});

		await test.step('initiate a voice call from room toolbar', async () => {
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await expect(user1.poHomeChannel.voiceCalls.callWidget).toBeVisible();
			await user1.poHomeChannel.voiceCalls.initiateCall();
		});

		await test.step('user2 accepts the call', async () => {
			await user2.poHomeChannel.voiceCalls.acceptCall();
		});

		await test.step('user2 ends the call', async () => {
			await user2.poHomeChannel.voiceCalls.btnEndCall('user1').click();
			await expect(user2.poHomeChannel.voiceCalls.callWidget).not.toBeVisible();
			await expect(user1.poHomeChannel.voiceCalls.callWidget).not.toBeVisible();
		});
	});

	test('should handle call controls during active call', async () => {
		const [user1, user2] = sessions;
		await test.step('establish call connection', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.content.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.initiateCall();
			await user2.poHomeChannel.voiceCalls.acceptCall();
		});

		await test.step('should mute/unmute microphone from user1', async () => {
			// User1 mutes microphone
			await user1.poHomeChannel.voiceCalls.btnMute.click();
			await expect(user1.poHomeChannel.voiceCalls.btnMute).toHaveAttribute('title', 'Unmute');

			// User1 unmutes microphone
			await user1.poHomeChannel.voiceCalls.btnMute.click();
			await expect(user1.poHomeChannel.voiceCalls.btnMute).toHaveAttribute('title', 'Mute');
		});

		await test.step('should put call on hold from user1', async () => {
			// User1 puts call on hold
			await user1.poHomeChannel.voiceCalls.btnHold.click();
			await expect(user1.poHomeChannel.voiceCalls.btnHold).toHaveAttribute('title', 'Resume');

			// User1 resumes call
			await user1.poHomeChannel.voiceCalls.btnHold.click();
			await expect(user1.poHomeChannel.voiceCalls.btnHold).toHaveAttribute('title', 'Hold');
		});

		await test.step('should access dialpad during call', async () => {
			// User1 opens dial pad
			await user1.poHomeChannel.voiceCalls.btnOpenDialpad.click();
			await expect(user1.poHomeChannel.voiceCalls.btnOpenDialpad).toHaveAttribute('title', 'Close dialpad');

			// User1 closes dial pad
			await user1.poHomeChannel.voiceCalls.btnOpenDialpad.click();
			await expect(user1.poHomeChannel.voiceCalls.btnOpenDialpad).toHaveAttribute('title', 'Open dialpad');
		});

		await test.step('should end the call from user1', async () => {
			await user1.poHomeChannel.voiceCalls.btnEndCall('user2').click();
			await expect(user1.poHomeChannel.voiceCalls.callWidget).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.callWidget).not.toBeVisible();
		});
	});

	test('should transfer call to another user', async ({ browser, api }) => {
		const [user1, user2] = sessions;

		// Create user3 session only for this test
		await api.post('/users.setStatus', { status: 'online', username: 'user3' });

		const user3Context = await createAuxContext(browser, Users.user3);
		const user3 = { page: user3Context.page, poHomeChannel: new HomeChannel(user3Context.page) };

		await test.step('establish call between user1 and user2', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.content.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.initiateCall();
			await user2.poHomeChannel.voiceCalls.acceptCall();
		});

		await test.step('user1 transfers call to user3', async () => {
			await user1.poHomeChannel.voiceCalls.transferCall('user3');
			await user1.poHomeChannel.toastMessage.waitForDisplay({ type: 'success' });
			await expect(user1.poHomeChannel.voiceCalls.callWidget).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.callTransferWidget).toBeVisible();
		});

		await test.step('user3 receives transferred call', async () => {
			await expect(user3.poHomeChannel.voiceCalls.incommingCallTransferWidget).toBeVisible();
			await user3.poHomeChannel.voiceCalls.acceptCall();
		});

		await test.step('user3 ends the call', async () => {
			await user3.poHomeChannel.voiceCalls.btnEndCall('user2').click();
			await expect(user3.poHomeChannel.voiceCalls.callWidget).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.callWidget).not.toBeVisible();
		});
		await user3.page.close();
	});

	test('should decline incoming voice call', async () => {
		const [user1, user2] = sessions;

		await test.step('user1 initiates call to user2', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.content.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.initiateCall();
		});

		await test.step('user2 declines the call', async () => {
			await user2.poHomeChannel.voiceCalls.btnRejectCall.click();
		});

		await test.step('Verify call widget disappears', async () => {
			await expect(user1.poHomeChannel.voiceCalls.callWidget).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.callWidget).not.toBeVisible();
		});
	});
});
