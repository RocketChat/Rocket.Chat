import type { Locator } from '@playwright/test';

import { Admin } from './admin';

export class AdminImports extends Admin {
	get btnImportNewFile(): Locator {
		return this.page.locator('.rcx-button--primary.rcx-button >> text="Import New File"');
	}

	async getOptionFileType(option: string): Promise<Locator> {
		await this.page.locator('.rcx-select').click();
		return this.page.locator(`.rcx-option__content >> text="${option}"`);
	}

	get inputFile(): Locator {
		return this.page.locator('input[type=file]');
	}

	get btnImport(): Locator {
		return this.page.locator('.rcx-button--primary.rcx-button >> text="Import"');
	}

	get btnStartImport(): Locator {
		return this.page.locator('.rcx-button--primary.rcx-button >> text="Start Importing"');
	}

	get importStatusTableFirstRowCell(): Locator {
		return this.page.locator('[data-qa-id="ImportTable"] tbody tr:first-child td >> text="Completed successfully"');
	}
}
