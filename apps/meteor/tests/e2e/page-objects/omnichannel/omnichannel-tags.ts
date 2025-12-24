import type { Locator } from '@playwright/test';

import { OmnichannelAdmin } from './omnichannel-admin';

export class OmnichannelTags extends OmnichannelAdmin {
	get btnCreateTag(): Locator {
		return this.createByName('tag');
	}

	get inputName(): Locator {
		return this.page.locator('[name="name"]');
	}

	btnDeleteByName(name: string): Locator {
		return this.page.getByRole('link', { name }).getByRole('button');
	}

	findRowByName(name: string): Locator {
		return this.page.getByRole('link', { name });
	}

	get inputDepartments(): Locator {
		return this.page.locator('input[placeholder="Select an option"]');
	}

	private selectOption(name: string): Locator {
		return this.page.locator('#position-container').getByRole('option', { name });
	}

	async selectDepartment(name: string) {
		await this.inputDepartments.click();
		await this.inputDepartments.fill(name);
		await this.selectOption(name).click();
	}
}
