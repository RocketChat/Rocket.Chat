import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';
import { OmnichannelSidebar, ToastMessages } from '../fragments';
import { ConfirmDeleteModal } from '../fragments/modals';
import { Table } from '../fragments/table';

type OmnichannelAdminRoutes =
	| 'monitors'
	| 'agents'
	| 'departments'
	| 'managers'
	| 'customfields'
	| 'current/chats'
	| 'current/contacts'
	| 'sla-policies'
	| 'priorities'
	| 'triggers'
	| 'tags'
	| 'analytics'
	| 'reports'
	| 'canned-responses'
	| 'units'
	| 'appearance'
	| 'businessHours'
	| 'livechat-appearance'
	| 'realtime-monitoring'
	| 'security-privacy';

/**
 * A page under `/omnichannel/*`. Subclasses declare `route` and `title` and get
 * `goTo()`, `pageHeader` and `table` for free.
 */
export abstract class OmnichannelAdmin {
	protected abstract readonly route: OmnichannelAdminRoutes;

	/** Text of the page's main heading. */
	protected abstract readonly title: string;

	/** Accessible name of the page's main table, when it differs from `title`. */
	protected readonly tableName?: string;

	protected readonly page: Page;

	protected readonly toastMessage: ToastMessages;

	readonly sidebar: OmnichannelSidebar;

	readonly deleteModal: ConfirmDeleteModal;

	constructor(page: Page) {
		this.page = page;
		this.sidebar = new OmnichannelSidebar(page);
		this.toastMessage = new ToastMessages(page);
		this.deleteModal = new ConfirmDeleteModal(page.getByRole('dialog', { name: 'Are you sure?' }));
	}

	get inputSearch() {
		return this.page.getByRole('main').getByRole('textbox', { name: 'Search' });
	}

	get btnSaveChanges(): Locator {
		return this.page.getByRole('button', { name: 'Save changes' });
	}

	getButtonByType(type: 'unit' | 'SLA policy' | 'tag' | 'trigger' | 'department' | 'custom field'): Locator {
		return this.page.locator('header').getByRole('button', { name: `Create ${type}` });
	}

	async search(text: string) {
		await this.inputSearch.fill(text);
	}

	async clearSearch() {
		await this.inputSearch.fill('');
	}

	get emptyState() {
		return this.page.getByRole('group', { name: 'No results found', exact: true });
	}

	waitForEmptyState() {
		return expect(this.emptyState).toBeVisible();
	}

	get pageHeader(): Locator {
		return this.page.locator('main').getByRole('heading', { name: this.title, exact: true });
	}

	get table(): Table {
		return new Table(this.page.getByRole('table', { name: this.tableName ?? this.title }));
	}

	async goTo() {
		await this.page.goto(`/omnichannel/${this.route}`);
		await this.waitForPage();
	}

	protected async waitForPage() {
		await this.pageHeader.waitFor({ state: 'visible' });
		await this.table.waitForDisplay(this.emptyState);
	}
}
