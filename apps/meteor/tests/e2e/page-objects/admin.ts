import type { Locator, Page } from '@playwright/test';

import { AdminSidebar, ToastMessages } from './fragments';
import { ConfirmDeleteModal } from './fragments/modals';
import { RoutedPage } from './routed-page';

export enum AdminSectionsHref {
	workspace = '/admin/info',
	subscription = '/admin/subscription',
	engagement = '/admin/engagement/users',
	moderation = '/admin/moderation',
	rooms = '/admin/rooms',
	users = '/admin/users',
	invites = '/admin/invites',
	userStatus = '/admin/user-status',
	permissions = '/admin/permissions',
	deviceManagement = '/admin/device-management',
	emailInboxes = '/admin/email-inboxes',
	mailer = '/admin/mailer',
	thirdPartyLogin = '/admin/third-party-login',
	integrations = '/admin/integrations',
	import = '/admin/import',
	reports = '/admin/analytic-reports',
	sounds = '/admin/sounds',
	emoji = '/admin/emoji',
	settings = '/admin/settings',
}

/**
 * A page under `/admin/*`. Subclasses declare `route` and `title` and get `goto()`, `pageContent`
 * and their ready state for free; override `waitForReady()` when the heading is not a strong enough
 * signal that the page is usable.
 */
export abstract class Admin extends RoutedPage {
	protected abstract override readonly route: AdminSectionsHref | `${AdminSectionsHref}/${string}`;

	/** Text of the page's main heading. Identifies the page and scopes `pageContent`. */
	protected abstract readonly title: string;

	readonly sidebar: AdminSidebar;

	readonly deleteModal: ConfirmDeleteModal;

	readonly toastMessage: ToastMessages;

	constructor(page: Page) {
		super(page);
		this.sidebar = new AdminSidebar(page);
		this.deleteModal = new ConfirmDeleteModal(page.getByRole('dialog', { name: 'Are you sure?' }));
		this.toastMessage = new ToastMessages(page);
	}

	/** The `main` region of this page, scoped by its heading so it cannot match another route. */
	get pageContent(): Locator {
		return this.page.getByRole('main').filter({ has: this.page.getByRole('heading', { name: this.title, exact: true }) });
	}

	async waitForReady(): Promise<void> {
		await this.pageContent.waitFor({ state: 'visible' });
	}

	get btnAdd(): Locator {
		return this.page.getByRole('button', { name: 'Add', exact: true });
	}

	get btnBack(): Locator {
		return this.page.getByRole('button', { name: 'Back', exact: true });
	}

	get btnSave(): Locator {
		return this.page.getByRole('button', { name: 'Save', exact: true });
	}

	get btnNew(): Locator {
		return this.page.getByRole('button', { name: 'New', exact: true });
	}

	get btnSaveChanges(): Locator {
		return this.page.getByRole('button', { name: 'Save changes' });
	}

	get btnDelete(): Locator {
		return this.page.getByRole('button', { name: 'Delete', exact: true });
	}

	getAccordionBtnByName(name: string): Locator {
		return this.page.getByRole('button', { name, exact: true });
	}

	async adminSectionButton(href: AdminSectionsHref): Promise<Locator> {
		return this.page.locator(`a[href="${href}"]`);
	}

	findFileRowByUsername(username: string) {
		return this.page.locator('tr', { has: this.page.getByRole('cell', { name: username }) });
	}

	findFileCheckboxByUsername(username: string) {
		return this.findFileRowByUsername(username).locator('label', { has: this.page.getByRole('checkbox') });
	}
}
