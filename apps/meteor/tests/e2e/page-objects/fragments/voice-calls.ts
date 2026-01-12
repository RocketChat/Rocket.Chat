import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';

export class VoiceCalls {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	async initiateCall(): Promise<void> {
		await expect(this.callWidget).toBeVisible();
		await this.btnCall.click();
		await expect(this.btnCancel).toBeVisible();
	}

	async acceptCall(): Promise<void> {
		await expect(this.btnAcceptCall).toBeVisible();
		await this.btnAcceptCall.click();
		await expect(this.btnOpenDialpad).toBeVisible();
	}

	async rejectCall(): Promise<void> {
		await expect(this.btnRejectCall).toBeVisible();
		await this.btnRejectCall.click();
	}

	get callWidget(): Locator {
		return this.page.getByRole('article', { name: 'New call' });
	}

	get btnCall(): Locator {
		return this.page.getByRole('button', { name: 'Call', exact: true });
	}

	get callControlGroup(): Locator {
		return this.page.getByRole('article').getByRole('group');
	}

	btnEndCall(name: string): Locator {
		return this.callControlGroup.getByRole('button', { name: `End call with ${name}` });
	}

	get btnCancel(): Locator {
		return this.page.getByRole('button', { name: 'Cancel', exact: true });
	}

	get btnAcceptCall(): Locator {
		return this.page.getByRole('button', { name: 'Accept', exact: true });
	}

	get btnRejectCall(): Locator {
		return this.page.getByRole('button', { name: 'Reject', exact: true });
	}

	get btnOpenDialpad(): Locator {
		return this.page.getByRole('button', { name: /Dialpad/i });
	}

	get btnMute(): Locator {
		return this.page.getByRole('button', { name: /Mute/i });
	}

	get btnHold(): Locator {
		return this.page.getByRole('button', { name: /Hold|Resume/i });
	}

	get btnTransfer(): Locator {
		return this.page.getByRole('button', { name: 'Forward', exact: true });
	}

	get transferModal(): Locator {
		return this.page.getByRole('dialog', { name: 'Transfer call' });
	}

	get inputUsername(): Locator {
		return this.transferModal.getByRole('textbox', { name: 'Enter username or number' });
	}

	get btnHangupAndTransfer(): Locator {
		return this.transferModal.getByRole('button', { name: 'Hang up and transfer call', exact: true });
	}

	get callTransferWidget(): Locator {
		return this.page.getByRole('heading', { name: 'Transferring call...' });
	}

	get incommingCallTransferWidget(): Locator {
		return this.page.getByRole('heading', { name: 'Incoming call transfer...' });
	}

	async transferCall(username: string): Promise<void> {
		await this.btnTransfer.click();
		await expect(this.transferModal).toBeVisible();
		await this.inputUsername.click();
		await this.inputUsername.fill(username);
		await this.page.getByRole('option', { name: username }).getByRole('figure').click();
		await expect(this.transferModal).toContainText(username);
		await this.btnHangupAndTransfer.click();
	}
}
