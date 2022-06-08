import { Locator, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import BasePage from './BasePage';

export default class LiveChat extends BasePage {
	get btnOpenLiveChat(): Locator {
		return this.getPage().locator('[aria-label="L"]');
	}

	get btnSounds(): Locator {
		return this.getPage().locator('header nav button[content="Sound is on"]');
	}

	get btnMinimize(): Locator {
		return this.getPage().locator('header nav button[content="Minimize chat"]');
	}

	get btnExpand(): Locator {
		return this.getPage().locator('header nav button[content="Expand chat"]');
	}

	get inputName(): Locator {
		return this.getPage().locator('[name="name"]');
	}

	get inputEmail(): Locator {
		return this.getPage().locator('[name="email"]');
	}

	get textAreaMessage(): Locator {
		return this.getPage().locator('[name="message"]');
	}

	get btnSendMessage(): Locator {
		return this.getPage().locator('[type="submit"] >> text="Send"');
	}

	get btnOk(): Locator {
		return this.getPage().locator('button >> text="OK"');
	}

	public async renderAllElements(): Promise<void> {
		const elements = [
			this.inputName,
			this.inputEmail,
			this.textAreaMessage,
			this.btnSendMessage,
			this.btnSounds,
			this.btnMinimize,
			this.btnExpand,
		];
		await Promise.all(elements.map((element) => expect(element).toBeVisible()));
	}

	public async doSendMessage(): Promise<void> {
		const fullName = faker.name.findName();
		const [firstName] = fullName.split(' ');
		const email = faker.internet.email(firstName.toLowerCase());

		await this.inputName.type(fullName);
		await this.inputEmail.type(email);
		await this.textAreaMessage.type('any_message');
		await this.btnSendMessage.click();
	}
}
