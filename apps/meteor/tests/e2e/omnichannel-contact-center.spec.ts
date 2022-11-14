import faker from '@faker-js/faker';

import { OmnichannelContacts } from './page-objects/omnichannel-contacts-list';
import { OmnichannelSection } from './page-objects/omnichannel-section';
import { test, expect } from './utils/test';
import { createToken } from '../../client/lib/utils/createToken';

const createContact = (generateToken = false) => ({
	id: null,
	name: `${faker.name.firstName()} ${faker.name.lastName()}`,
	email: faker.internet.email().toLowerCase(),
	phone: faker.phone.phoneNumber('+############'),
	token: generateToken ? createToken() : null,
	customFields: {},
});

const NEW_CONTACT = createContact();
const EDIT_CONTACT = createContact();
const EXISTING_CONTACT = createContact(true);

const URL = {
	contactCenter: '/omnichannel-directory/contacts',
	newContact: '/omnichannel-directory/contacts/new',
	get editContact() {
		return `${this.contactCenter}/edit/${NEW_CONTACT.id}`;
	},
	get contactInfo() {
		return `${this.contactCenter}/info/${NEW_CONTACT.id}`;
	},
};

const ERROR = {
	nameRequired: 'The field Name is required.',
	invalidEmail: 'Invalid email address',
	existingEmail: 'Email already exists',
	existingPhone: 'Phone already exists',
};

test.use({ storageState: 'admin-session.json' });

test.describe('Omnichannel Contact Center', () => {
	let poContacts: OmnichannelContacts;
	let poOmniSection: OmnichannelSection;

	test.beforeAll(async ({ api }) => {
		// Add a contact
		const { id: _, ...data } = EXISTING_CONTACT;
		await api.post('/omnichannel/contact', data);
	});

	test.afterAll(async ({ api }) => {
		// Remove added contacts
		await api.delete('/livechat/visitor', { token: EXISTING_CONTACT.token });
		await api.delete('/livechat/visitor', { token: NEW_CONTACT.token });
	});

	test.beforeEach(async ({ page }) => {
		poContacts = new OmnichannelContacts(page);
		poOmniSection = new OmnichannelSection(page);
	});

	test.afterEach(async ({ api }) => {
		await api
			.get('/omnichannel/contact.search', { phone: NEW_CONTACT.phone })
			.then((res) => res.json())
			.then((res) => {
				NEW_CONTACT.token = res.contact?.token;
				NEW_CONTACT.id = res.contact?._id;
			});
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await poOmniSection.btnContactCenter.click();
		await page.waitForURL(URL.contactCenter);
	});

	test('Add new contact', async ({ page }) => {
		await test.step('cancel button', async () => {
			await poContacts.btnNewContact.click();
			await page.waitForURL(URL.newContact);
			await expect(poContacts.newContact.newContactTitle).toBeVisible();
			await poContacts.newContact.btnCancel.click();
			await page.waitForURL(URL.contactCenter);
			await expect(poContacts.newContact.newContactTitle).not.toBeVisible();
		});

		await test.step('open contextual bar', async () => {
			await poContacts.btnNewContact.click();
			await page.waitForURL(URL.newContact);
			await expect(poContacts.newContact.newContactTitle).toBeVisible();
			await expect(poContacts.newContact.btnSave).toBeDisabled();
		});

		await test.step('input name', async () => {
			await poContacts.newContact.inputName.type(NEW_CONTACT.name);
		});

		await test.step('validate email format', async () => {
			await poContacts.newContact.inputEmail.type('invalidemail');
			await expect(poContacts.newContact.errorMessage(ERROR.invalidEmail)).toBeVisible();
		});

		await test.step('validate existing email', async () => {
			await poContacts.newContact.inputEmail.selectText();
			await poContacts.newContact.inputEmail.type(EXISTING_CONTACT.email);
			await expect(poContacts.newContact.errorMessage(ERROR.existingEmail)).toBeVisible();
			await expect(poContacts.newContact.btnSave).toBeDisabled();
		});

		await test.step('input email', async () => {
			await poContacts.newContact.inputEmail.selectText();
			await poContacts.newContact.inputEmail.type(NEW_CONTACT.email);
			await expect(poContacts.newContact.errorMessage(ERROR.invalidEmail)).not.toBeVisible();
			await expect(poContacts.newContact.errorMessage(ERROR.existingEmail)).not.toBeVisible();
		});

		await test.step('validate existing phone ', async () => {
			await poContacts.newContact.inputPhone.type(EXISTING_CONTACT.phone);
			await expect(poContacts.newContact.errorMessage(ERROR.existingPhone)).toBeVisible();
			await expect(poContacts.newContact.btnSave).toBeDisabled();
		});

		await test.step('input phone ', async () => {
			await poContacts.newContact.inputPhone.selectText();
			await poContacts.newContact.inputPhone.type(NEW_CONTACT.phone);
			await expect(poContacts.newContact.errorMessage(ERROR.existingPhone)).not.toBeVisible();
		});

		await test.step('save new contact ', async () => {
			await expect(poContacts.newContact.btnSave).toBeEnabled();
			await poContacts.newContact.btnSave.click();
			await page.waitForURL(URL.contactCenter);
			await expect(poContacts.toastSuccess).toBeVisible();

			await poContacts.inputSearch.type(NEW_CONTACT.name);
			await expect(poContacts.findRowByName(NEW_CONTACT.name)).toBeVisible();
		});
	});

	test('Edit new contact', async ({ page }) => {
		await test.step('search contact and open contextual bar', async () => {
			await poContacts.inputSearch.type(NEW_CONTACT.name);
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
			poContacts.contactInfo.btnEdit.click();
			await page.waitForURL(URL.editContact);
		});

		await test.step('initial values', async () => {
			await expect(poContacts.contactInfo.inputName).toHaveValue(NEW_CONTACT.name);
			await expect(poContacts.contactInfo.inputEmail).toHaveValue(NEW_CONTACT.email);
			await expect(poContacts.contactInfo.inputPhone).toHaveValue(NEW_CONTACT.phone);
		});

		await test.step('validate email format', async () => {
			await poContacts.contactInfo.inputEmail.selectText();
			await poContacts.contactInfo.inputEmail.type('invalidemail');
			await expect(poContacts.contactInfo.errorMessage(ERROR.invalidEmail)).toBeVisible();
		});

		await test.step('validate existing email', async () => {
			await poContacts.contactInfo.inputEmail.selectText();
			await poContacts.contactInfo.inputEmail.type(EXISTING_CONTACT.email);
			await expect(poContacts.contactInfo.errorMessage(ERROR.existingEmail)).toBeVisible();
			await expect(poContacts.contactInfo.btnSave).toBeDisabled();
		});

		await test.step('input email', async () => {
			await poContacts.contactInfo.inputEmail.selectText();
			await poContacts.contactInfo.inputEmail.type(EDIT_CONTACT.email);
			await expect(poContacts.contactInfo.errorMessage(ERROR.invalidEmail)).not.toBeVisible();
			await expect(poContacts.contactInfo.errorMessage(ERROR.existingEmail)).not.toBeVisible();
			await expect(poContacts.contactInfo.btnSave).toBeEnabled();
		});

		await test.step('validate existing phone ', async () => {
			await poContacts.contactInfo.inputPhone.selectText();
			await poContacts.contactInfo.inputPhone.type(EXISTING_CONTACT.phone);
			await expect(poContacts.contactInfo.errorMessage(ERROR.existingPhone)).toBeVisible();
			await expect(poContacts.contactInfo.btnSave).toBeDisabled();
		});

		await test.step('input phone ', async () => {
			await poContacts.contactInfo.inputPhone.selectText();
			await poContacts.contactInfo.inputPhone.type(EDIT_CONTACT.phone);
			await expect(poContacts.contactInfo.errorMessage(ERROR.existingPhone)).not.toBeVisible();
			await expect(poContacts.contactInfo.btnSave).toBeEnabled();
		});

		await test.step('validate name is required', async () => {
			await poContacts.contactInfo.inputName.selectText();
			await poContacts.contactInfo.inputName.type(' ');

			await expect(poContacts.contactInfo.btnSave).toBeEnabled();
			await poContacts.contactInfo.btnSave.click();
			await expect(poContacts.contactInfo.errorMessage(ERROR.nameRequired)).toBeVisible();
		});

		await test.step('edit name', async () => {
			await poContacts.contactInfo.inputName.selectText();
			await poContacts.contactInfo.inputName.type(EDIT_CONTACT.name);
		});

		await test.step('save new contact ', async () => {
			await poContacts.contactInfo.btnSave.click();
			await expect(poContacts.toastSuccess).toBeVisible();

			await poContacts.inputSearch.selectText();
			await poContacts.inputSearch.type(EDIT_CONTACT.name);
			await expect(poContacts.findRowByName(EDIT_CONTACT.name)).toBeVisible();
		});
	});
});
