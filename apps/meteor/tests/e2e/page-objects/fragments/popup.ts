import type { Locator } from 'playwright-core';

import { expect } from '../../utils/test';

export abstract class Popup {
	constructor(protected root: Locator) {}

	waitForDisplay() {
		return expect(this.root).toBeVisible();
	}

	waitForDismissal() {
		return expect(this.root).not.toBeVisible();
	}
}
