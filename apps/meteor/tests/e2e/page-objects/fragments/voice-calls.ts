import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class VoiceCallControls {
	private readonly _controls: Locator;

	constructor(controls: Locator) {
		this._controls = controls;
	}

	get call(): Locator {
		return this._controls.getByRole('button', { name: 'Call', exact: true });
	}

	get accept(): Locator {
		return this._controls.getByRole('button', { name: 'Accept', exact: false });
	}

	get hangup(): Locator {
		return this._controls.getByRole('button', { name: /End call|Reject/, exact: false });
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

	private readonly transferModal: TransferModal;

	constructor(page: Page) {
		// this.page = page;
		this.transferModal = new TransferModal(page, page.getByRole('dialog', { name: 'Transfer call' }));
		this.root = page.getByRole('dialog', { name: 'Voice call', exact: false });
		this.callControls = new VoiceCallControls(this.root.getByRole('group'));
	}

	get content(): Locator {
		return this.root;
	}

	get controls(): VoiceCallControls {
		return this.callControls;
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
}

export class VoiceCalls {
	public readonly widget: Widget;

	constructor(page: Page) {
		this.widget = new Widget(page);
	}
}
