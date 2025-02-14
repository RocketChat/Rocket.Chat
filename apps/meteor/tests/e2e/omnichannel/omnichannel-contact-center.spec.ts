import { faker } from '@faker-js/faker';

import { createToken } from '../../../client/lib/utils/createToken';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelContacts } from '../page-objects/omnichannel-contacts-list';
import { OmnichannelSection } from '../page-objects/omnichannel-section';
import { test, expect } from '../utils/test';

const createContact = (generateToken = false) => ({
	id: null,
	name: `${faker.person.firstName()} ${faker.person.lastName()}`,
	email: faker.internet.email().toLowerCase(),
	phone: faker.phone.number('+############'),
	token: generateToken ? createToken() : null,
	customFields: {},
});

const NEW_CONTACT = createContact();
const EDIT_CONTACT = createContact();
const EXISTING_CONTACT = {
	id: undefined,
	name: `${faker.person.firstName()} ${faker.person.lastName()}`,
	emails: [faker.internet.email().toLowerCase()],
	phones: [faker.phone.number('+############')],
	token: undefined,
};
const NEW_CUSTOM_FIELD = {
	searchable: true,
	field: 'hiddenCustomField',
	label: 'hiddenCustomField',
	defaultValue: 'test_contact_center_hidden_customField',
	scope: 'visitor',
	visibility: 'hidden',
	required: true,
	regexp: '',
};

const URL = {
	contactCenter: '/omnichannel-directory/contacts',
	newContact: '/omnichannel-directory/contacts/new',
	get editContact() {
		return `${this.contactCenter}/edit/${NEW_CONTACT.id}`;
	},
	get contactInfo() {
		return `${this.contactCenter}/details/${NEW_CONTACT.id}`;
	},
};

const ERROR = {
	nameRequired: 'Name required',
	invalidEmail: 'Invalid email address',
	emailRequired: 'Email required',
	emailAlreadyExists: 'Email already exists',
	phoneRequired: 'Phone required',
	phoneAlreadyExists: 'Phone already exists',
};

test.use({ storageState: Users.admin.state });

test.describe('Omnichannel Contact Center', () => {
	let poContacts: OmnichannelContacts;
	let poOmniSection: OmnichannelSection;

	test.beforeAll(async ({ api }) => {
		// Add a contact
		await api.post('/omnichannel/contacts', EXISTING_CONTACT);

		if (IS_EE) {
			await api.post('/livechat/custom.field', NEW_CUSTOM_FIELD);
		}
	});

	test.afterAll(async ({ api }) => {
		// Remove added contact
		await api.delete(`/livechat/visitor/${NEW_CONTACT.token}`);
		await api.delete(`/livechat/visitor/${EXISTING_CONTACT.token}`);

		if (IS_EE) {
			await api.post('method.call/livechat:removeCustomField', { message: NEW_CUSTOM_FIELD.field });
		}
	});

	test.beforeEach(async ({ page }) => {
		poContacts = new OmnichannelContacts(page);
		poOmniSection = new OmnichannelSection(page);
	});

	test.afterEach(async ({ api }) => {
		await api
			.get('/omnichannel/contacts.search', { searchText: NEW_CONTACT.phone })
			.then((res) => res.json())
			.then((res) => {
				NEW_CONTACT.token = res.contacts?.[0]?.token;
				NEW_CONTACT.id = res.contacts?.[0]?._id;
			});

		await api
			.get('/omnichannel/contacts.search', { searchText: EXISTING_CONTACT.phones[0] })
			.then((res) => res.json())
			.then((res) => {
				EXISTING_CONTACT.token = res.contacts?.[0]?.token;
				EXISTING_CONTACT.id = res.contacts?.[0]?._id;
			});
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await poOmniSection.btnContactCenter.click();
		await poOmniSection.tabContacts.click();
		await page.waitForURL(URL.contactCenter);
	});

	test('Add new contact', async ({ page }) => {
		await test.step('cancel button', async () => {
			await poContacts.btnNewContact.click();
			await page.waitForURL(URL.newContact);
			await expect(poContacts.newContact.inputName).toBeVisible();
			await poContacts.newContact.btnCancel.click();
			await page.waitForURL(URL.contactCenter);
			await expect(poContacts.newContact.inputName).not.toBeVisible();
		});

		await test.step('open contextual bar', async () => {
			await poContacts.btnNewContact.click();
			await page.waitForURL(URL.newContact);
			await expect(poContacts.newContact.inputName).toBeVisible();
		});

		await test.step('input name', async () => {
			await poContacts.newContact.inputName.fill(NEW_CONTACT.name);
		});

		await test.step('validate email format', async () => {
			await poContacts.newContact.btnAddEmail.click();
			await poContacts.newContact.inputEmail.fill('invalidemail');
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.invalidEmail)).toBeVisible();
		});

		await test.step('validate email is duplicated', async () => {
			await poContacts.newContact.inputEmail.fill(EXISTING_CONTACT.emails[0]);
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.emailAlreadyExists)).toBeVisible();
		});

		await test.step('validate email is required', async () => {
			await poContacts.newContact.inputEmail.clear();
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.emailRequired)).toBeVisible();
		});

		await test.step('input email', async () => {
			await poContacts.newContact.inputEmail.fill(NEW_CONTACT.email);
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.invalidEmail)).not.toBeVisible();
			await expect(poContacts.newContact.getErrorMessage(ERROR.emailRequired)).not.toBeVisible();
			await expect(poContacts.newContact.getErrorMessage(ERROR.emailAlreadyExists)).not.toBeVisible();
		});

		await test.step('validate phone is duplicated', async () => {
			await poContacts.newContact.btnAddPhone.click();
			await poContacts.newContact.inputPhone.fill(EXISTING_CONTACT.phones[0]);
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.phoneAlreadyExists)).toBeVisible();
		});

		await test.step('input phone', async () => {
			await poContacts.newContact.inputPhone.fill(NEW_CONTACT.phone);
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.phoneRequired)).not.toBeVisible();
		});

		await test.step('save new contact', async () => {
			await expect(poContacts.newContact.btnSave).toBeEnabled();
			await poContacts.newContact.btnSave.click();

			await poContacts.inputSearch.fill(NEW_CONTACT.name);
			await expect(poContacts.findRowByName(NEW_CONTACT.name)).toBeVisible();
		});
	});

	test('Edit new contact', async ({ page }) => {
		await test.step('search contact and open contextual bar', async () => {
			await poContacts.inputSearch.fill(NEW_CONTACT.name);
			const row = poContacts.findRowByName(NEW_CONTACT.name);
			await expect(row).toBeVisible();
			await row.click();
			await page.waitForURL(URL.contactInfo);
		});

		await test.step('cancel button', async () => {
			await poContacts.contactInfo.btnEdit.click();
			await page.waitForURL(URL.editContact);
			await poContacts.contactInfo.btnCancel.click();
			await page.waitForURL(URL.contactInfo);
		});

		await test.step('edit contact', async () => {
			await poContacts.contactInfo.btnEdit.click();
			await page.waitForURL(URL.editContact);
		});

		await test.step('initial values', async () => {
			await expect(poContacts.contactInfo.inputName).toHaveValue(NEW_CONTACT.name);
			await expect(poContacts.contactInfo.inputEmail).toHaveValue(NEW_CONTACT.email);
			await expect(poContacts.contactInfo.inputPhone).toHaveValue(NEW_CONTACT.phone);
		});

		await test.step('validate email format', async () => {
			await poContacts.newContact.inputEmail.fill('invalidemail');
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.invalidEmail)).toBeVisible();
		});

		await test.step('validate email is duplicated', async () => {
			await poContacts.newContact.inputEmail.fill(EXISTING_CONTACT.emails[0]);
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.emailAlreadyExists)).toBeVisible();
		});

		await test.step('validate email is required', async () => {
			await poContacts.newContact.inputEmail.clear();
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.emailRequired)).toBeVisible();
		});

		await test.step('validate name is required', async () => {
			await poContacts.contactInfo.inputName.clear();
			await page.keyboard.press('Tab');
			await expect(poContacts.contactInfo.getErrorMessage(ERROR.nameRequired)).toBeVisible();
		});

		await test.step('edit name', async () => {
			await poContacts.contactInfo.inputName.fill(EDIT_CONTACT.name);
		});

		await test.step('validate phone is duplicated', async () => {
			await poContacts.newContact.inputPhone.fill(EXISTING_CONTACT.phones[0]);
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.phoneAlreadyExists)).toBeVisible();
		});

		await test.step('input phone ', async () => {
			await poContacts.newContact.inputPhone.fill(EDIT_CONTACT.phone);
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.phoneRequired)).not.toBeVisible();
		});

		await test.step('input email', async () => {
			await poContacts.newContact.inputEmail.fill(EDIT_CONTACT.email);
			await page.keyboard.press('Tab');
			await expect(poContacts.newContact.getErrorMessage(ERROR.invalidEmail)).not.toBeVisible();
			await expect(poContacts.newContact.getErrorMessage(ERROR.emailRequired)).not.toBeVisible();
			await expect(poContacts.newContact.getErrorMessage(ERROR.emailAlreadyExists)).not.toBeVisible();
		});

		await test.step('save new contact ', async () => {
			await poContacts.contactInfo.btnSave.click();

			await poContacts.inputSearch.fill(EDIT_CONTACT.name);
			await expect(poContacts.findRowByName(EDIT_CONTACT.name)).toBeVisible();
		});
	});
});
