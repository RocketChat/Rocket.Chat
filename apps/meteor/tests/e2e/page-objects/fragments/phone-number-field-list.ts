import type { Locator } from '@playwright/test';

export class PhoneNumberFieldList {
	constructor(private readonly root: Locator) {}

	get btnAddPhone(): Locator {
		return this.root.getByRole('button', { name: 'Add phone', exact: true });
	}

	getPhoneNumberInput(index: number): Locator {
		return this.root.getByRole('textbox', { name: `Phone number ${index + 1}`, exact: true });
	}

	getPhoneLabelInput(index: number): Locator {
		return this.root.getByRole('textbox', { name: new RegExp(`Label for phone.*${index + 1}`) });
	}

	getRemovePhoneButton(index: number): Locator {
		return this.root.getByRole('button', { name: /remove phone/i }).nth(index);
	}

	get inputPhoneNumber(): Locator {
		return this.root.getByRole('textbox', { name: /Phone number \d+/, exact: true });
	}

	private get inputPhoneLabel(): Locator {
		return this.root.getByRole('textbox', { name: /Label for phone.*\d+/, exact: true });
	}

	get removePhoneButtons(): Locator {
		return this.root.getByRole('button', { name: /remove phone/i });
	}

	async removePhone(index: number): Promise<void> {
		await this.getRemovePhoneButton(index).click();
	}

	async addPhone(number: string, label?: string): Promise<void> {
		await this.btnAddPhone.click();

		await this.inputPhoneNumber.last().fill(number);

		if (typeof label === 'string') {
			await this.inputPhoneLabel.last().fill(label);
		}
	}

	async setPhone(index: number, number: string, label?: string): Promise<void> {
		if (typeof number === 'string') {
			await this.getPhoneNumberInput(index).fill(number);
		}

		if (typeof label === 'string') {
			await this.getPhoneLabelInput(index).fill(label);
		}
	}
}
