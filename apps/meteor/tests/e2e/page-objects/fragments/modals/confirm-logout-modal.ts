import { Modal } from './modal';

export class ConfirmLogoutModal extends Modal {
	get btnLogout() {
		return this.root.getByRole('button', { name: 'Log out device' });
	}

	async confirmLogout() {
		await this.btnLogout.click();
		await this.waitForDismissal();
	}
}
