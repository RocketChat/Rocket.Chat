import { createFakeMessage, createFakeRoom, createFakeSubscription, mockAppRoot } from '@rocket.chat/mock-providers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MessageToolbarActionMenu from './MessageToolbarActionMenu';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';
import type { MessageActionConfig } from '../contexts/MessageAction';

const room = createFakeRoom({ _id: 'room' });
const subscription = createFakeSubscription({ rid: room._id });
const message = createFakeMessage({ _id: 'message', rid: room._id });
const encryptedMessage = createFakeMessage({ _id: 'encrypted', rid: room._id, t: 'e2e', e2e: 'pending' });

const action = ({
	label,
	...overrides
}: { id: string; label: string } & Omit<Partial<MessageActionConfig>, 'id' | 'label'>): MessageActionConfig => ({
	icon: 'edit',
	order: 0,
	group: 'menu',
	action: jest.fn(),
	label: label as TranslationKey,
	...overrides,
});

const renderMenu = (actions: MessageActionConfig[], { encrypted = false } = {}) => {
	const onChangeMenuVisibility = jest.fn();
	const root = mockAppRoot().withTranslations('en', 'core', {
		More: 'More',
		Apps: 'Apps',
		Unavailable: 'Unavailable',
		Edit: 'Edit',
		Delete: 'Delete',
		Copy_link: 'Copy link',
	});
	const { wrapper } = mockMessageProviders({ root, toolbar: { useMenuActions: () => actions } });

	render(
		<MessageToolbarActionMenu
			message={encrypted ? encryptedMessage : message}
			context='message'
			room={room}
			subscription={subscription}
			onChangeMenuVisibility={onChangeMenuVisibility}
		/>,
		{ wrapper },
	);

	return { onChangeMenuVisibility };
};

const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'More' }));

describe('MessageToolbarActionMenu', () => {
	it('should render nothing without actions', () => {
		renderMenu([]);

		expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
	});

	it('should sort the actions by order and keep the app actions last', async () => {
		renderMenu([
			action({ id: 'app', label: 'App action', type: 'apps', order: -1 }),
			action({ id: 'delete', label: 'Delete', order: 10, type: 'management' }),
			action({ id: 'edit', label: 'Edit', order: 1, type: 'management' }),
		]);

		await openMenu();

		const items = screen.getAllByRole('menuitem');
		expect(items).toHaveLength(3);
		expect(items[0]).toHaveTextContent('Edit');
		expect(items[1]).toHaveTextContent('Delete');
		expect(items[2]).toHaveTextContent('App action');
		expect(screen.getByText('Apps')).toBeInTheDocument();
	});

	it('should leave out the actions meant for other contexts', async () => {
		renderMenu([action({ id: 'edit', label: 'Edit' }), action({ id: 'permalink-star', label: 'Copy_link', context: ['starred'] })]);

		await openMenu();

		expect(screen.getAllByRole('menuitem')).toHaveLength(1);
		expect(screen.queryByRole('menuitem', { name: /Copy link/ })).not.toBeInTheDocument();
	});

	it('should run the action clicked and report the menu visibility', async () => {
		const edit = action({ id: 'edit', label: 'Edit' });
		const { onChangeMenuVisibility } = renderMenu([edit]);

		await openMenu();

		expect(onChangeMenuVisibility).toHaveBeenLastCalledWith(true);

		await userEvent.click(screen.getByRole('menuitem', { name: /Edit/ }));

		expect(edit.action).toHaveBeenCalled();
		expect(onChangeMenuVisibility).toHaveBeenLastCalledWith(false);
	});

	it('should replace the app actions of an encrypted message with an unavailable item', async () => {
		const appAction = action({ id: 'app', label: 'App action', type: 'apps' });
		renderMenu([action({ id: 'edit', label: 'Edit', type: 'management' }), appAction], { encrypted: true });

		await openMenu();

		expect(screen.queryByRole('menuitem', { name: /App action/ })).not.toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: /Unavailable/ })).toHaveAttribute('aria-disabled', 'true');
	});
});
