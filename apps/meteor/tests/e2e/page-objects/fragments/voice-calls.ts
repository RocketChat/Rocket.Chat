import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

const timerToSeconds = (time: string): number => {
	const [seconds, minutes, hours = '00'] = time.split(':').reverse();
	if (!seconds || !minutes) {
		throw new Error('Voice call timer has an invalid time format');
	}
	return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

export class VoiceCallControls {
	private readonly _controls: Locator;

	constructor(controls: Locator) {
		this._controls = controls;
	}

	get call(): Locator {
		return this._controls.getByRole('button', { name: 'Call', exact: true });
	}

	get accept(): Locator {
		return this._controls.getByRole('button', { name: 'Accept', exact: true });
	}

	get hangup(): Locator {
		return this._controls.getByRole('button', { name: /End call|Reject/, exact: true });
	}

	get cancel(): Locator {
		return this._controls.getByRole('button', { name: 'Cancel', exact: true });
	}

	get dialpad(): Locator {
		return this._controls.getByRole('button', { name: /Dialpad/i });
	}

	get mute(): Locator {
		return this._controls.getByRole('button', { name: /Mute/i });
	}

	get hold(): Locator {
		return this._controls.getByRole('button', { name: /Hold|Resume/i });
	}

	get transfer(): Locator {
		return this._controls.getByRole('button', { name: 'Forward', exact: true });
	}

	get shareScreen(): Locator {
		return this._controls.getByRole('button', { name: /Share screen|Stop sharing screen/i });
	}

	get toggleChat(): Locator {
		return this._controls.getByRole('button', { name: /Hide chat|Show chat/i });
	}

	get directMessage(): Locator {
		return this._controls.getByRole('button', { name: /Direct message/i });
	}
}

export class TransferModal {
	private readonly root: Locator;

	private readonly page: Page;

	constructor(page: Page, root: Locator) {
		this.page = page;
		this.root = root;
	}

	get content(): Locator {
		return this.root;
	}

	get input(): Locator {
		return this.root.getByRole('textbox');
	}

	get hangUpAndTransfer(): Locator {
		return this.root.getByRole('button', { name: 'Hang up and transfer call', exact: true });
	}

	async transferCall(username: string): Promise<void> {
		// await this.input.click();
		await this.input.fill(username);
		// Options have to be gotten from the page since the Options are rendered on a portal
		await this.page.getByRole('option', { name: username }).getByRole('figure').click();
		await expect(this.content).toContainText(username);
		await this.hangUpAndTransfer.click();
	}
}

export class Widget {
	private readonly root: Locator;

	private readonly callControls: VoiceCallControls;

	private readonly headerControls: VoiceCallControls;

	private readonly transferModal: TransferModal;

	constructor(page: Page) {
		this.transferModal = new TransferModal(page, page.getByRole('dialog', { name: 'Transfer call' }));
		this.root = page.getByRole('dialog', { name: 'Voice call', exact: false });
		this.callControls = new VoiceCallControls(this.root.getByRole('group'));
		this.headerControls = new VoiceCallControls(this.root.getByRole('banner'));
	}

	get content(): Locator {
		return this.root;
	}

	get controls(): VoiceCallControls {
		return this.callControls;
	}

	get timer(): Locator {
		return this.root.getByRole('time');
	}

	async getTimerContentInSeconds() {
		const text = await this.timer.innerText();
		return timerToSeconds(text);
	}

	async initiateCall(): Promise<void> {
		await this.callControls.call.click();
		await expect(this.callControls.cancel).toBeVisible();
	}

	async acceptCall(): Promise<void> {
		await this.callControls.accept.click();
		await expect(this.callControls.hangup).toBeVisible();
	}

	async endCall(): Promise<void> {
		await this.callControls.hangup.click();
		await expect(this.content).not.toBeVisible();
	}

	async goToDm(): Promise<void> {
		await this.headerControls.directMessage.click();
		await expect(this.content).not.toBeVisible();
	}

	async transferCall(username: string): Promise<void> {
		await this.callControls.transfer.click();
		await expect(this.transferModal.content).toBeVisible();
		await this.transferModal.transferCall(username);
		await expect(this.transferModal.content).not.toBeVisible();
		await expect(this.content).not.toBeVisible();
	}

	async muteSelf(): Promise<void> {
		await this.callControls.mute.click();
		await expect(this.callControls.mute).toHaveAttribute('title', 'Unmute');
	}

	async unmuteSelf(): Promise<void> {
		await this.callControls.mute.click();
		await expect(this.callControls.mute).toHaveAttribute('title', 'Mute');
	}

	async holdSelf(): Promise<void> {
		await this.callControls.hold.click();
		await expect(this.callControls.hold).toHaveAttribute('title', 'Resume');
	}

	async resumeSelf(): Promise<void> {
		await this.callControls.hold.click();
		await expect(this.callControls.hold).toHaveAttribute('title', 'Hold');
	}

	async openDialpad(): Promise<void> {
		await this.callControls.dialpad.click();
		await expect(this.callControls.dialpad).toHaveAttribute('title', 'Close dialpad');
	}

	async closeDialpad(): Promise<void> {
		await this.callControls.dialpad.click();
		await expect(this.callControls.dialpad).toHaveAttribute('title', 'Open dialpad');
	}

	get allScreenShareVideos(): Locator {
		return this.root.locator('video');
	}

	async shareScreen(): Promise<void> {
		await this.callControls.shareScreen.click();
		await expect(this.callControls.shareScreen).toHaveAttribute('title', 'Stop sharing screen');
	}

	async stopSharing(): Promise<void> {
		await this.callControls.shareScreen.click();
		await expect(this.callControls.shareScreen).toHaveAttribute('title', 'Share screen');
	}
}

export class RoomSection {
	private readonly root: Locator;

	public readonly callControls: VoiceCallControls;

	public readonly otherControls: VoiceCallControls;

	constructor(page: Page) {
		this.root = page.getByRole('region', { name: 'Voice call' });
		// Right now there are 2 control groups in the room view, with no discrimination between them
		this.callControls = new VoiceCallControls(this.root.getByRole('group').first());
		this.otherControls = new VoiceCallControls(this.root.getByRole('group').last());
	}

	get content(): Locator {
		return this.root;
	}

	get controls(): VoiceCallControls {
		return this.callControls;
	}

	get timer(): Locator {
		return this.root.getByRole('time');
	}

	get allScreenShareVideos(): Locator {
		return this.root.locator('video');
	}

	async getTimerContentInSeconds() {
		const text = await this.timer.innerText();
		return timerToSeconds(text);
	}

	async endCall(): Promise<void> {
		await this.callControls.hangup.click();
		await expect(this.content).not.toBeVisible();
	}

	async hideChat(): Promise<void> {
		await expect(this.otherControls.toggleChat).toHaveAccessibleName(/Hide chat/i);
		await this.otherControls.toggleChat.click();
		await expect(this.otherControls.toggleChat).toHaveAccessibleName(/Show chat/i);
	}

	async showChat(): Promise<void> {
		await expect(this.otherControls.toggleChat).toHaveAccessibleName(/Show chat/i);
		await this.otherControls.toggleChat.click();
		await expect(this.otherControls.toggleChat).toHaveAccessibleName(/Hide chat/i);
	}

	async muteSelf(): Promise<void> {
		await this.callControls.mute.click();
		await expect(this.callControls.mute).toHaveAttribute('title', 'Unmute');
	}

	async unmuteSelf(): Promise<void> {
		await this.callControls.mute.click();
		await expect(this.callControls.mute).toHaveAttribute('title', 'Mute');
	}

	async holdSelf(): Promise<void> {
		await this.callControls.hold.click();
		await expect(this.callControls.hold).toHaveAttribute('title', 'Resume');
	}

	async resumeSelf(): Promise<void> {
		await this.callControls.hold.click();
		await expect(this.callControls.hold).toHaveAttribute('title', 'Hold');
	}

	async shareScreen(): Promise<void> {
		await this.callControls.shareScreen.click();
		await expect(this.callControls.shareScreen).toHaveAttribute('title', 'Stop sharing screen');
	}

	async stopSharing(): Promise<void> {
		await this.callControls.shareScreen.click();
		await expect(this.callControls.shareScreen).toHaveAttribute('title', 'Share screen');
	}

	peerCard(username: string): Locator {
		return this.root.getByText(username);
	}
}

export class VoiceCalls {
	public readonly widget: Widget;

	public readonly roomSection: RoomSection;

	constructor(page: Page) {
		this.widget = new Widget(page);
		this.roomSection = new RoomSection(page);
	}
}
