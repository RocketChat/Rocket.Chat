import type { Locator } from '@playwright/test';

import { MenuMoveTo } from './menu';
import { CreateNewCategoryModal } from './modals';

export class RoomHeader {
	readonly menuMoveTo: MenuMoveTo;

	readonly createCategoryModal: CreateNewCategoryModal;

	constructor(public root: Locator) {
		this.menuMoveTo = new MenuMoveTo(this.root.page());
		this.createCategoryModal = new CreateNewCategoryModal(this.root.page());
	}

	private get btnSelectCategory(): Locator {
		return this.root.getByRole('button', { name: 'Move to', exact: true });
	}

	async openCategorySelector(): Promise<void> {
		await this.btnSelectCategory.click();
		await this.menuMoveTo.waitForDisplay();
	}

	async pickCategoryMenuItem(name: string): Promise<void> {
		await this.openCategorySelector();
		await this.menuMoveTo.selectMenuItem(name);
	}

	async checkRoomBelongsToGroup(optionName: string): Promise<boolean> {
		await this.openCategorySelector();
		const exists = await this.menuMoveTo.getMenuItem(optionName).isVisible();
		await this.root.page().keyboard.press('Escape');
		return exists;
	}

	async createCategory(name: string): Promise<void> {
		await this.pickCategoryMenuItem('New category');
		await this.createCategoryModal.inputName.fill(name);
		await this.createCategoryModal.create(true);
	}
}
