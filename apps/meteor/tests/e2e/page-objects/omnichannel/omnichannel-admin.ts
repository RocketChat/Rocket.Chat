import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';
import { OmnichannelSidebar, ToastMessages } from '../fragments';
import { ConfirmDeleteModal } from '../fragments/modals';
import { Table } from '../fragments/table';
import { RoutedPage } from '../routed-page';

export enum OmnichannelSectionsHref {
	currentChats = '/omnichannel/current/chats',
	currentContacts = '/omnichannel/current/contacts',
	agents = '/omnichannel/agents',
	managers = '/omnichannel/managers',
	monitors = '/omnichannel/monitors',
	departments = '/omnichannel/departments',
	units = '/omnichannel/units',
	customFields = '/omnichannel/customfields',
	cannedResponses = '/omnichannel/canned-responses',
	triggers = '/omnichannel/triggers',
	tags = '/omnichannel/tags',
	priorities = '/omnichannel/priorities',
	slaPolicies = '/omnichannel/sla-policies',
	businessHours = '/omnichannel/businessHours',
	appearance = '/omnichannel/appearance',
	livechatAppearance = '/omnichannel/livechat-appearance',
	analytics = '/omnichannel/analytics',
	reports = '/omnichannel/reports',
	realtimeMonitoring = '/omnichannel/realtime-monitoring',
	securityPrivacy = '/omnichannel/security-privacy',
}

/**
 * A page under `/omnichannel/*`. Subclasses declare `route` and `title` and get
 * `goto()`, `pageHeader` and `table` for free.
 */
export abstract class OmnichannelAdmin extends RoutedPage {
	protected abstract override readonly route: OmnichannelSectionsHref;

	/** Text of the page's main heading. */
	protected abstract readonly title: string;

	/** Accessible name of the page's main table, when it differs from `title`. */
	protected readonly tableName?: string;

	protected readonly toastMessage: ToastMessages;

	readonly sidebar: OmnichannelSidebar;

	readonly deleteModal: ConfirmDeleteModal;

	constructor(page: Page) {
		super(page);
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

	async waitForReady(): Promise<void> {
		await this.pageHeader.waitFor({ state: 'visible' });
		await this.table.waitForDisplay(this.emptyState);
	}
}
