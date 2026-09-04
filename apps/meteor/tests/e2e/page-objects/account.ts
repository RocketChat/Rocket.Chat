import type { Locator, Page } from '@playwright/test';

import { AccountSidebar, ToastMessages } from './fragments';
import { RoutedPage } from './routed-page';

export enum AccountSectionsHref {
	preferences = '/account/preferences',
	profile = '/account/profile',
	security = '/account/security',
	integrations = '/account/integrations',
	tokens = '/account/tokens',
	omnichannel = '/account/omnichannel',
	featurePreview = '/account/feature-preview',
	accessibilityAndAppearance = '/account/accessibility-and-appearance',
	manageDevices = '/account/manage-devices',
}

/**
 * A page under `/account/*`. Subclasses declare `route` and `title` and get `goto()`,
 * `pageContent` and their ready state for free.
 */
export abstract class Account extends RoutedPage {
	protected abstract override readonly route: AccountSectionsHref;

	/** Text of the page's main heading. Identifies the page and scopes `pageContent`. */
	protected abstract readonly title: string;

	readonly toastMessage: ToastMessages;

	readonly sidebar: AccountSidebar;

	constructor(page: Page) {
		super(page);
		this.toastMessage = new ToastMessages(page);
		this.sidebar = new AccountSidebar(page);
	}

	/** The `main` region of this page, scoped by its heading so it cannot match another route. */
	get pageContent(): Locator {
		return this.page.getByRole('main').filter({ has: this.page.getByRole('heading', { name: this.title, exact: true }) });
	}

	async waitForReady(): Promise<void> {
		await this.pageContent.waitFor({ state: 'visible' });
	}

	protected get saveChangesButton() {
		return this.page.getByRole('button', { name: 'Save changes' });
	}
}
