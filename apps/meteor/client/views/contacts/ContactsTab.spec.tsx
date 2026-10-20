import type { IContactPublic, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ContactsTab from './ContactsTab';

jest.mock('../../lib/getURL', () => ({ getURL: (path: string) => path }));

jest.mock('@rocket.chat/ui-voip', () => ({
	usePeekMediaSessionState: () => 'available',
	useWidgetExternalControls: () => ({ toggleWidget: jest.fn() }),
}));

const PAGE_SIZE = 25;

const createContact = (index: number): Serialized<IContactPublic> => {
	const givenName = `Contact ${String(index).padStart(2, '0')}`;

	return {
		_id: `contact-${index}`,
		_updatedAt: new Date('2026-10-20T10:00:00.000Z').toISOString(),
		source: 'local',
		displayName: givenName,
		givenName,
		emails: [],
		phones: [],
	};
};

const renderContactsTab = (
	total: number,
	onDelete: (contacts: Serialized<IContactPublic>[], contactId: string) => Serialized<IContactPublic>[],
) => {
	let contacts = Array.from({ length: total }, (_, index) => createContact(index + 1));

	const listContacts = jest.fn(({ offset = 0, count = PAGE_SIZE }: { offset?: number; count?: number }) => {
		const items = contacts.slice(offset, offset + count);

		return { items, count: items.length, offset, total: contacts.length, syncedTotal: 0, success: true as const };
	});

	render(<ContactsTab tab='contacts' onChangeTab={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/contacts.list', listContacts)
			.withEndpoint('POST', '/v1/contacts.delete', ({ contactId }) => {
				contacts = onDelete(contacts, contactId);

				return null;
			})
			.build(),
	});

	return { listContacts };
};

const deleteContact = async (displayName: string) => {
	const row = await screen.findByRole('link', { name: new RegExp(displayName) });

	await userEvent.click(within(row).getByRole('button', { name: 'Options' }));
	await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
	await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));
};

describe('ContactsTab', () => {
	it('goes back to the last page that still has contacts when a deletion empties the one shown', async () => {
		renderContactsTab(PAGE_SIZE + 1, (contacts, contactId) => contacts.filter(({ _id }) => _id !== contactId));

		await userEvent.click(await screen.findByRole('button', { name: 'Page 2' }));
		await deleteContact('Contact 26');

		expect(await screen.findByText('Contact 01')).toBeInTheDocument();
		expect(screen.queryByText('No_contacts')).not.toBeInTheDocument();
	});

	it('shows the empty state on the first page once no contact is left on any page', async () => {
		const { listContacts } = renderContactsTab(PAGE_SIZE + 1, () => []);

		await userEvent.click(await screen.findByRole('button', { name: 'Page 2' }));
		await deleteContact('Contact 26');

		expect(await screen.findByText('No_contacts')).toBeInTheDocument();
		expect(listContacts).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 0 }));
	});
});
