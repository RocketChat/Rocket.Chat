import type { Locator, Page } from '@playwright/test';

import { AdminSidebar, ToastMessages } from './fragments';
import { ConfirmDeleteModal } from './fragments/modals';

export enum AdminSectionsHref {
	Workspace = '/admin/info',
	Subscription = '/admin/subscription',
	Engagement = '/admin/engagement/users',
	Moderation = '/admin/moderation',
	Rooms = '/admin/rooms',
	Users = '/admin/users',
	Invites = '/admin/invites',
	User_Status = '/admin/user-status',
	Permissions = '/admin/permissions',
	Device_Management = '/admin/device-management',
	Email_Inboxes = '/admin/email-inboxes',
	Mailer = '/admin/mailer',
	Third_party_login = '/admin/third-party-login',
	Integrations = '/admin/integrations',
	Import = '/admin/import',
	Reports = '/admin/analytic-reports',
	Sounds = '/admin/sounds',
	Emoji = '/admin/emoji',
	Settings = '/admin/settings',
}
export abstract class Admin {
	readonly sidebar: AdminSidebar;

	readonly deleteModal: ConfirmDeleteModal;

	readonly toastMessage: ToastMessages;

	constructor(protected page: Page) {
		this.sidebar = new AdminSidebar(page);
		this.deleteModal = new ConfirmDeleteModal(page.getByRole('dialog', { name: 'Are you sure?' }));
		this.toastMessage = new ToastMessages(page);
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
