import type { Page } from '@playwright/test';

import { IS_EE } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { setSettingValueById } from './utils';
import { expect, test } from './utils/test';

test.describe('Internal Voice Calls - Enterprise Edition', () => {
	test.skip(!IS_EE, 'Enterprise Edition Only');
	let sessions: { page: Page; poHomeChannel: HomeChannel }[];

	test.beforeAll(async ({ api }) => {
		await setSettingValueById(api, 'VoIP_TeamCollab_Screen_Sharing_Enabled', false);
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

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'VoIP_TeamCollab_Screen_Sharing_Enabled', true);
		await Promise.all([...sessions.map(({ page }) => page.close())]);
	});

	test('should initiate voice call from direct message', async () => {
		const [user1, user2] = sessions;

		await test.step('should open direct message with user2', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
		});

		await test.step('initiate a voice call from room toolbar', async () => {
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await expect(user1.poHomeChannel.voiceCalls.widget.content).toBeVisible();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();
		});

		await test.step('user2 accepts the call', async () => {
			await user2.poHomeChannel.voiceCalls.widget.acceptCall();
		});

		await test.step('user2 ends the call', async () => {
			await user2.poHomeChannel.voiceCalls.widget.endCall();
			await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			await expect(user1.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
		});
	});

	test('should handle call controls during active call', async () => {
		const [user1, user2] = sessions;
		await test.step('establish call connection', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();
			await user2.poHomeChannel.voiceCalls.widget.acceptCall();
		});

		await test.step('should mute/unmute microphone from user1', async () => {
			// User1 mutes microphone
			await user1.poHomeChannel.voiceCalls.widget.muteSelf();

			// User1 unmutes microphone
			await user1.poHomeChannel.voiceCalls.widget.unmuteSelf();
		});

		await test.step('should put call on hold from user1', async () => {
			// User1 puts call on hold
			await user1.poHomeChannel.voiceCalls.widget.holdSelf();

			// User1 resumes call
			await user1.poHomeChannel.voiceCalls.widget.resumeSelf();
		});

		await test.step('should access dialpad during call', async () => {
			// User1 opens dial pad
			await user1.poHomeChannel.voiceCalls.widget.openDialpad();

			// User1 closes dial pad
			await user1.poHomeChannel.voiceCalls.widget.closeDialpad();
		});

		await test.step('should end the call from user1', async () => {
			await user1.poHomeChannel.voiceCalls.widget.endCall();
			await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
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
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();
			await user2.poHomeChannel.voiceCalls.widget.acceptCall();
		});

		await test.step('user1 transfers call to user3', async () => {
			await user1.poHomeChannel.voiceCalls.widget.transferCall('user3');
			await user1.poHomeChannel.toastMessage.waitForDisplay({ type: 'success' });
			await expect(user1.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.widget.content).toHaveAccessibleName(/Transferring call.../gi);
		});

		await test.step('user3 receives transferred call', async () => {
			await expect(user3.poHomeChannel.voiceCalls.widget.content).toBeVisible();
			await expect(user3.poHomeChannel.voiceCalls.widget.content).toHaveAccessibleName(/Incoming call transfer.../gi);
			await user3.poHomeChannel.voiceCalls.widget.acceptCall();
		});

		await test.step('user3 ends the call', async () => {
			await user3.poHomeChannel.voiceCalls.widget.endCall();
			await expect(user3.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
		});

		await user3.page.close();
	});

	test('should decline incoming voice call', async () => {
		const [user1, user2] = sessions;

		await test.step('user1 initiates call to user2', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();
		});

		await test.step('user2 declines the call', async () => {
			await user2.poHomeChannel.voiceCalls.widget.endCall();
		});

		await test.step('Verify call widget disappears', async () => {
			await expect(user1.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
		});
	});
});

test.describe('Internal Voice Calls - In-room view - Enterprise Edition', () => {
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

	test.afterAll(async () => {
		await Promise.all([...sessions.map(({ page }) => page.close())]);
	});

	test('should show in-room view when navigating to peer DM during call', async () => {
		const [user1, user2] = sessions;

		await test.step('establish call from user1 DM with user2', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();
			await user2.poHomeChannel.voiceCalls.widget.acceptCall();
		});

		await test.step('widget should be hidden and room view should be visible', async () => {
			await expect(user1.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			await expect(user1.poHomeChannel.voiceCalls.roomSection.content).toBeVisible();
		});

		await test.step('user cards should have correct names', async () => {
			await expect(user1.poHomeChannel.voiceCalls.roomSection.peerCard('user1')).toBeVisible();
			await expect(user1.poHomeChannel.voiceCalls.roomSection.peerCard('user2')).toBeVisible();
		});

		await test.step('mute/unmute and hold/resume', async () => {
			await user1.poHomeChannel.voiceCalls.roomSection.muteSelf();
			await user1.poHomeChannel.voiceCalls.roomSection.unmuteSelf();

			await user1.poHomeChannel.voiceCalls.roomSection.holdSelf();
			await user1.poHomeChannel.voiceCalls.roomSection.resumeSelf();
		});

		await test.step('should change chat visibility', async () => {
			// Visible by default
			await expect(user1.poHomeChannel.voiceCalls.roomSection.content).toBeVisible();
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
			await expect(user1.poHomeChannel.voiceCalls.roomSection.otherControls.toggleChat).toHaveAccessibleName(/Hide chat/i);
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();

			// Hide
			await user1.poHomeChannel.voiceCalls.roomSection.hideChat();
			await expect(user1.poHomeChannel.composer.inputMessage).not.toBeVisible();

			// Show
			await user1.poHomeChannel.voiceCalls.roomSection.showChat();
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
		});

		await test.step('end call to clean up', async () => {
			await user1.poHomeChannel.voiceCalls.roomSection.endCall();
			await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.roomSection.content).not.toBeVisible();
		});
	});

	test('should switch views when navigating into and away from peer DM', async () => {
		const [user1, user2] = sessions;

		await test.step('establish call and navigate to peer DM', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();
			await user2.poHomeChannel.voiceCalls.widget.acceptCall();
		});

		await test.step('navigate user1 away from peer DM', async () => {
			await expect(user1.poHomeChannel.voiceCalls.roomSection.content).toBeVisible();
			const initialRoomViewTimer = await user1.poHomeChannel.voiceCalls.roomSection.getTimerContentInSeconds();

			await user1.poHomeChannel.navbar.openChat('general');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();

			await expect(user1.poHomeChannel.voiceCalls.widget.content).toBeVisible();
			await expect(user1.poHomeChannel.voiceCalls.roomSection.content).not.toBeVisible();

			const widgetTimer = await user1.poHomeChannel.voiceCalls.widget.getTimerContentInSeconds();
			expect(widgetTimer).toBeGreaterThanOrEqual(initialRoomViewTimer);
		});

		await test.step('return to peer DM (go to dm button)', async () => {
			await expect(user1.poHomeChannel.voiceCalls.widget.content).toBeVisible();
			const initialWidgetTimer = await user1.poHomeChannel.voiceCalls.widget.getTimerContentInSeconds();

			await user1.poHomeChannel.voiceCalls.widget.goToDm();

			await expect(user1.poHomeChannel.voiceCalls.roomSection.content).toBeVisible();
			await expect(user1.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();

			const roomTimer = await user1.poHomeChannel.voiceCalls.roomSection.getTimerContentInSeconds();
			expect(roomTimer).toBeGreaterThanOrEqual(initialWidgetTimer);
		});

		await test.step('end call to clean up', async () => {
			await user1.poHomeChannel.voiceCalls.roomSection.endCall();
			await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
		});
	});

	// Maybe flaky
	test('Screen sharing', async () => {
		const [user1, user2] = sessions;

		await test.step('establish call and navigate to peer DM', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();
			await user2.poHomeChannel.voiceCalls.widget.acceptCall();
			await expect(user1.poHomeChannel.voiceCalls.roomSection.content).toBeVisible();
		});

		await test.step('start screen sharing with both users', async () => {
			await user1.poHomeChannel.voiceCalls.roomSection.shareScreen();

			await expect(user1.poHomeChannel.voiceCalls.roomSection.allScreenShareVideos).toHaveCount(1);
			await expect(user2.poHomeChannel.voiceCalls.widget.allScreenShareVideos).toHaveCount(1);

			await user2.poHomeChannel.voiceCalls.widget.shareScreen();
			await expect(user1.poHomeChannel.voiceCalls.roomSection.allScreenShareVideos).toHaveCount(2);
			await expect(user2.poHomeChannel.voiceCalls.widget.allScreenShareVideos).toHaveCount(2);
		});

		await test.step('stop sharing with user1 through room view', async () => {
			await user1.poHomeChannel.voiceCalls.roomSection.stopSharing();
			await expect(user1.poHomeChannel.voiceCalls.roomSection.allScreenShareVideos).toHaveCount(1);
			await expect(user2.poHomeChannel.voiceCalls.widget.allScreenShareVideos).toHaveCount(1);
		});

		await test.step('stop sharing with user2 through widget', async () => {
			await user2.poHomeChannel.voiceCalls.widget.stopSharing();

			await expect(user1.poHomeChannel.voiceCalls.roomSection.allScreenShareVideos).toHaveCount(0);
			await expect(user2.poHomeChannel.voiceCalls.widget.allScreenShareVideos).toHaveCount(0);
		});

		await test.step('end call to clean up', async () => {
			await user1.poHomeChannel.voiceCalls.roomSection.endCall();
			await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.roomSection.content).not.toBeVisible();
		});
	});
});

test.describe('Internal Voice Calls - Popout view - Enterprise Edition', () => {
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

	test.afterAll(async () => {
		await Promise.all([...sessions.map(({ page }) => page.close())]);
	});

	test('should show popout view', async () => {
		const [user1, user2] = sessions;

		await test.step('establish call from user1 DM with user2', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();
			await user2.poHomeChannel.voiceCalls.widget.acceptCall();
		});

		await test.step('should open popout for both users', async () => {
			await user1.poHomeChannel.voiceCalls.openPopoutRoom();
			await expect(user1.poHomeChannel.voiceCalls.popout.content).toBeVisible();

			await user2.poHomeChannel.voiceCalls.openPopoutWidget();
			await expect(user2.poHomeChannel.voiceCalls.popout.content).toBeVisible();
		});

		await test.step('user cards should have correct names', async () => {
			await expect(user1.poHomeChannel.voiceCalls.popout.peerCard('user1')).toBeVisible();
			await expect(user1.poHomeChannel.voiceCalls.popout.peerCard('user2')).toBeVisible();

			await expect(user2.poHomeChannel.voiceCalls.popout.peerCard('user1')).toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.popout.peerCard('user2')).toBeVisible();
		});

		await test.step('mute/unmute and hold/resume', async () => {
			await user1.poHomeChannel.voiceCalls.popout.muteSelf();
			await user2.poHomeChannel.voiceCalls.popout.muteSelf();

			await user1.poHomeChannel.voiceCalls.popout.unmuteSelf();
			await user2.poHomeChannel.voiceCalls.popout.unmuteSelf();

			await user1.poHomeChannel.voiceCalls.popout.holdSelf();
			await user2.poHomeChannel.voiceCalls.popout.holdSelf();

			await user1.poHomeChannel.voiceCalls.popout.resumeSelf();
			await user2.poHomeChannel.voiceCalls.popout.resumeSelf();
		});

		await test.step('Widget "Show call here" button', async () => {
			await expect(user2.poHomeChannel.voiceCalls.widget.btnShowCallHere).toBeVisible();
			await user2.poHomeChannel.voiceCalls.widget.showCallHere();
		});

		await test.step('Room "Show call here" button', async () => {
			await expect(user1.poHomeChannel.voiceCalls.roomSection.btnShowCallHere).toBeVisible();
			await user1.poHomeChannel.voiceCalls.roomSection.showCallHere();
		});

		await test.step('end call from within popup', async () => {
			await user1.poHomeChannel.voiceCalls.openPopoutRoom();
			await expect(user1.poHomeChannel.voiceCalls.popout.content).toBeVisible();

			await user1.poHomeChannel.voiceCalls.popout.endCall();
			await expect(user2.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			await expect(user2.poHomeChannel.voiceCalls.roomSection.content).not.toBeVisible();
		});
	});

	// Maybe flaky
	test('Screen sharing', async () => {
		const [user1, user2] = sessions;

		await test.step('establish call and open popout', async () => {
			await user1.poHomeChannel.navbar.openChat('user2');
			await expect(user1.poHomeChannel.composer.inputMessage).toBeVisible();
			await user1.poHomeChannel.content.btnVoiceCall.click();
			await user1.poHomeChannel.voiceCalls.widget.initiateCall();
			await user2.poHomeChannel.voiceCalls.widget.acceptCall();
			await expect(user1.poHomeChannel.voiceCalls.roomSection.content).toBeVisible();

			await user1.poHomeChannel.voiceCalls.openPopoutRoom();
			await expect(user1.poHomeChannel.voiceCalls.popout.content).toBeVisible();

			await user2.poHomeChannel.voiceCalls.openPopoutWidget();
			await expect(user2.poHomeChannel.voiceCalls.popout.content).toBeVisible();
		});

		await test.step('start screen sharing with both users', async () => {
			await user1.poHomeChannel.voiceCalls.popout.shareScreen();

			await expect(user1.poHomeChannel.voiceCalls.popout.allScreenShareVideos).toHaveCount(1);
			await expect(user2.poHomeChannel.voiceCalls.popout.allScreenShareVideos).toHaveCount(1);

			await user2.poHomeChannel.voiceCalls.popout.shareScreen();
			await expect(user1.poHomeChannel.voiceCalls.popout.allScreenShareVideos).toHaveCount(2);
			await expect(user2.poHomeChannel.voiceCalls.popout.allScreenShareVideos).toHaveCount(2);
		});

		await test.step('stop sharing with both users through popout', async () => {
			await user1.poHomeChannel.voiceCalls.popout.stopSharing();
			await expect(user1.poHomeChannel.voiceCalls.popout.allScreenShareVideos).toHaveCount(1);
			await expect(user2.poHomeChannel.voiceCalls.popout.allScreenShareVideos).toHaveCount(1);

			await user2.poHomeChannel.voiceCalls.popout.stopSharing();
			await expect(user1.poHomeChannel.voiceCalls.popout.allScreenShareVideos).toHaveCount(0);
			await expect(user2.poHomeChannel.voiceCalls.popout.allScreenShareVideos).toHaveCount(0);
		});

		await test.step('end call with user2 from the popout', async () => {
			await user2.poHomeChannel.voiceCalls.popout.endCall();
			await expect(user1.poHomeChannel.voiceCalls.widget.content).not.toBeVisible();
			await expect(user1.poHomeChannel.voiceCalls.roomSection.content).not.toBeVisible();
		});
	});
});
