import type { IContactPublic, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ContactMenu from './ContactMenu';

jest.mock('@rocket.chat/ui-voip', () => ({
	usePeekMediaSessionState: () => 'available',
	useWidgetExternalControls: () => ({ toggleWidget: jest.fn() }),
}));

const CONTACT_ID = 'contact-1';

const createContact = (over: Partial<Serialized<IContactPublic>> = {}): Serialized<IContactPublic> => ({
	_id: CONTACT_ID,
	_updatedAt: new Date('2026-10-20T10:00:00.000Z').toISOString(),
	source: 'local',
	displayName: 'Ada Lovelace',
	emails: [],
	phones: [],
	...over,
});

const renderMenu = (contact: Serialized<IContactPublic>) => {
	const setFavorite = jest.fn((_params: { contactId: string; favorite: boolean }) => null);

	render(<ContactMenu contact={contact} onEdit={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Favorite: 'Favorite',
				Unfavorite: 'Unfavorite',
				Favorite_Outlook: 'Favorite (Outlook)',
				Unfavorite_Outlook: 'Unfavorite (Outlook)',
			})
			.withEndpoint('POST', '/v1/contacts.favorite', setFavorite)
			.build(),
	});

	return { setFavorite };
};

const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'Options' }));

describe('ContactMenu', () => {
	it('marks a local contact as a favorite', async () => {
		const { setFavorite } = renderMenu(createContact());

		await openMenu();
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Favorite' }));

		await waitFor(() => expect(setFavorite).toHaveBeenCalledWith(expect.objectContaining({ contactId: CONTACT_ID, favorite: true })));
	});

	it('takes a local favorite out of the favorites', async () => {
		const { setFavorite } = renderMenu(createContact({ favorite: true }));

		await openMenu();
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Unfavorite' }));

		await waitFor(() => expect(setFavorite).toHaveBeenCalledWith(expect.objectContaining({ contactId: CONTACT_ID, favorite: false })));
	});

	it('lets a contact synced from Graph be marked as a favorite, since Graph cannot read the one in Outlook', async () => {
		const { setFavorite } = renderMenu(createContact({ source: 'outlook', syncProvider: 'graph' }));

		await openMenu();
		await userEvent.click(await screen.findByRole('menuitem', { name: 'Favorite' }));

		await waitFor(() => expect(setFavorite).toHaveBeenCalledWith(expect.objectContaining({ contactId: CONTACT_ID, favorite: true })));
	});

	it('shows the favorite option of a contact synced from EWS as disabled, since it is changed in Outlook', async () => {
		renderMenu(createContact({ source: 'outlook', syncProvider: 'ews', favorite: true }));

		await openMenu();

		expect(await screen.findByRole('menuitem', { name: 'Unfavorite (Outlook)' })).toHaveAttribute('aria-disabled', 'true');
	});

	it('shows Favorite (Outlook) as disabled for a contact synced from EWS that is not a favorite', async () => {
		renderMenu(createContact({ source: 'outlook', syncProvider: 'ews' }));

		await openMenu();

		expect(await screen.findByRole('menuitem', { name: 'Favorite (Outlook)' })).toHaveAttribute('aria-disabled', 'true');
	});
});
