import type { Locator, Page } from '@playwright/test';

import { Admin, AdminSectionsHref } from './admin';
import { ABACMembershipPreview } from './fragments/abac-membership-preview';
import { Listbox } from './fragments/listbox';

export class AdminABACRooms extends Admin {
	readonly listbox: Listbox;

	readonly preview: ABACMembershipPreview;

	constructor(page: Page) {
		super(page);
		this.listbox = new Listbox(page);
		this.preview = new ABACMembershipPreview(page);
	}

	protected readonly route = AdminSectionsHref.abacRooms;

	protected readonly title = 'Attribute-based access control';

	private get editRoom(): Locator {
		return this.page.getByRole('dialog', { name: 'Edit room' });
	}

	get btnReviewChanges(): Locator {
		return this.editRoom.getByRole('button', { name: 'Review changes' });
	}

	async gotoEditRoom(rid: string): Promise<void> {
		await this.navigateTo(`${this.route}/edit/${rid}`, this.editRoom);
	}

	async addAttribute(key: string, values: string[]): Promise<void> {
		await this.editRoom.getByRole('button', { name: 'Add attribute' }).click();
		await this.editRoom.getByPlaceholder('Search attribute').last().click();
		await this.listbox.selectOption(key, true);
		await this.editRoom.getByPlaceholder('Select attribute values').last().click();
		for (const value of values) {
			await this.listbox.selectOption(value, true);
		}
		await this.editRoom.getByText('Room to be ABAC-managed').click();
	}

	async reviewChanges(): Promise<void> {
		await this.btnReviewChanges.click();
		await this.preview.waitForDisplay();
	}
}
