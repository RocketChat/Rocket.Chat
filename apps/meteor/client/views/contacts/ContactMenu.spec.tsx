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
			.withTranslations('en', 'core', { Favorite: 'Favorite', Unfavorite: 'Unfavorite', Favorite_Outlook: 'Favorite (Outlook)' })
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

	it('shows the favorite of an Outlook contact as disabled, since it is changed in Outlook', async () => {
		renderMenu(createContact({ source: 'outlook', favorite: true }));

		await openMenu();

		expect(await screen.findByRole('menuitem', { name: 'Favorite (Outlook)' })).toHaveAttribute('aria-disabled', 'true');
	});
});
