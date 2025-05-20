import type { Locator } from '@playwright/test';

import { expect } from '../../utils/test';

export abstract class Modal {
	constructor(protected root: Locator) {}

	waitForDismissal() {
		return expect(this.root).not.toBeVisible();
	}
}
