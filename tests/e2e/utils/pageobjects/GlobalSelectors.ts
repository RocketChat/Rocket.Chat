import Pages from './Pages';

export default class GlobalSelectors extends Pages {
	public async setText(selector: string, text: string): Promise<void> {
		await this.getPage().type(selector, text);
	}

	public async open(url = ''): Promise<void> {
		await super.open(url);
	}

	public async click(selector: string): Promise<void> {
		await this.getPage().click(selector);
	}

	public async clearInput(selector: string): Promise<void> {
		await this.getPage().click(selector, { clickCount: 3 });
		await this.getPage().keyboard.press('Backspace');
	}

	public async clearAllInputs(selectors: string[]): Promise<void> {
		const listOfActions = [];

		for (const selector of selectors) {
			listOfActions.push(this.clearInput(selector));
		}

		await Promise.all(listOfActions);
	}
}
