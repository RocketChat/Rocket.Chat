import type { Locator, Page } from '@playwright/test';

import { OmnichannelContactInfo } from '../omnichannel-info';
import { OmnichannelContactCenter } from './omnichannel-contact-center';
import { OmnichannelEditContactFlexTab } from '../../fragments/edit-contact-flaxtab';
import { Listbox } from '../../fragments/listbox';
import { OmnichannelDeleteContactModal } from '../../fragments/modals';
import { Table } from '../../fragments/table';

class OmnichannelContactCenterContactsTable extends Table {
	constructor(page: Page) {
		super(page.getByRole('table', { name: 'Omnichannel Contact Center Contacts' }));
	}
}

export class OmnichannelContactCenterContacts extends OmnichannelContactCenter {
	readonly contactInfo: OmnichannelContactInfo;

	readonly editContact: OmnichannelEditContactFlexTab;

	readonly table: OmnichannelContactCenterContactsTable;

	readonly deleteContactModal: OmnichannelDeleteContactModal;

	readonly listbox: Listbox;

	constructor(page: Page) {
		super(page);
		this.contactInfo = new OmnichannelContactInfo(page);
		this.editContact = new OmnichannelEditContactFlexTab(page);
		this.table = new OmnichannelContactCenterContactsTable(page);
		this.deleteContactModal = new OmnichannelDeleteContactModal(page);
		this.listbox = new Listbox(page);
	}

	get btnNewContact(): Locator {
		return this.page.getByRole('button', { name: 'New contact' });
	}

	async deleteContact(contactName: string) {
		await this.table.findRowByName(contactName).getByRole('button', { name: 'More Actions' }).click();
		await this.listbox.selectOption('Delete');
		await this.deleteContactModal.waitForDisplay();
	}
}
