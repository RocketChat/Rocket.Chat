import type { Locator, Page } from '@playwright/test';

import { expect } from '../../utils/test';
import { OmnichannelSidebar, ToastMessages } from '../fragments';
import { ConfirmDeleteModal } from '../fragments/modals';

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

export abstract class OmnichannelAdmin {
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

	protected async goToRoute(route: OmnichannelAdminRoutes) {
		await this.page.goto(`/omnichannel/${route}`);
	}

	protected getPageHeader(title: string): Locator {
		return this.page.locator('main').getByRole('heading', { name: title, exact: true });
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
}
