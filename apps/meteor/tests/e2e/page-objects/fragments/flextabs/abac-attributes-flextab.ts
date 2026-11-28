import type { Locator, Page } from '@playwright/test';

import { FlexTab } from './flextab';
import { ABACMembershipPreview } from '../abac-membership-preview';
import { Listbox } from '../listbox';

export class ABACAttributesFlexTab extends FlexTab {
	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Attribute-based access control' }));
	}

	getAttribute(key: string): Locator {
		return this.root.getByRole('region', { name: key });
	}
}

export class ABACManageAttributesFlexTab extends FlexTab {
	readonly listbox: Listbox;

	readonly preview: ABACMembershipPreview;

	constructor(page: Page) {
		super(page.getByRole('dialog', { name: 'Manage attributes' }));
		this.listbox = new Listbox(page);
		this.preview = new ABACMembershipPreview(page);
	}

	get btnReviewChanges(): Locator {
		return this.root.getByRole('button', { name: 'Review changes' });
	}

	private get btnFooterBack(): Locator {
		return this.root.getByRole('button', { name: 'Back', exact: true }).last();
	}

	async back(): Promise<void> {
		await this.btnFooterBack.click();
		await this.waitForDismissal();
	}

	async selectValues(values: string[]): Promise<void> {
		await this.root.getByPlaceholder('Select attribute values').last().click();
		for (const value of values) {
			await this.listbox.selectOption(value, true);
		}
		await this.root.getByText('Managing attributes may affect who can access this room.').click();
	}

	async reviewChanges(): Promise<void> {
		await this.btnReviewChanges.click();
		await this.preview.waitForDisplay();
	}
}
