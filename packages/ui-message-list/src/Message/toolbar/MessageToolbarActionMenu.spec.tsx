import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { LayoutContext } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import MessageToolbarActionMenu from './MessageToolbarActionMenu';
import MessageToolbarStarsActionMenu from './MessageToolbarStarsActionMenu';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';
import type { MessageActionConfig } from '../contexts/MessageAction';

const room = { _id: 'room', t: 'c' } as IRoom;
const subscription = { _id: 'subscription', rid: room._id, t: 'c' } as ISubscription;
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

const renderMenu = (actions: MessageActionConfig[], { encrypted = false, hidden = [] as string[] } = {}) => {
	const onChangeMenuVisibility = jest.fn();
	const root = mockAppRoot().withTranslations('en', 'core', {
		More: 'More',
		Apps: 'Apps',
		Unavailable: 'Unavailable',
		Edit: 'Edit',
		Delete: 'Delete',
		Copy_link: 'Copy link',
		AI_Actions: 'AI actions',
	});
	const layout = { hiddenActions: { messageToolbox: hidden, roomToolbox: [] } } as never;
	const { wrapper } = mockMessageProviders({
		root: root.wrap((children: ReactNode) => <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>),
		toolbar: { useMenuActions: () => actions, useAiActions: () => actions.filter((candidate) => candidate.id.startsWith('ai-')) },
	});

	const props = {
		message: encrypted ? encryptedMessage : message,
		context: 'message' as const,
		room,
		subscription,
		onChangeMenuVisibility,
	};

	render(
		<>
			<MessageToolbarActionMenu {...props} />
			<MessageToolbarStarsActionMenu {...props} />
		</>,
		{ wrapper },
	);

	return { onChangeMenuVisibility };
};

const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'More' }));

describe('MessageToolbarActionMenu', () => {
	it('renders nothing without actions (R14)', () => {
		renderMenu([]);

		expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
	});

	it('shows the menu when only apps offer an action (R14)', async () => {
		renderMenu([action({ id: 'app', label: 'App action', type: 'apps' })]);

		await openMenu();

		expect(screen.getByRole('menuitem', { name: /App action/ })).toBeInTheDocument();
	});

	it('orders the entries by their order and puts the apps last, in a section of their own (R12)', async () => {
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

	it('leaves out the entries meant for other places (R12)', async () => {
		renderMenu([action({ id: 'edit', label: 'Edit' }), action({ id: 'permalink-star', label: 'Copy_link', context: ['starred'] })]);

		await openMenu();

		expect(screen.getAllByRole('menuitem')).toHaveLength(1);
		expect(screen.queryByRole('menuitem', { name: /Copy link/ })).not.toBeInTheDocument();
	});

	it('leaves out the entries the layout hides but keeps the actions of apps (R13)', async () => {
		renderMenu(
			[
				action({ id: 'edit', label: 'Edit', type: 'management' }),
				action({ id: 'delete', label: 'Delete', type: 'management' }),
				action({ id: 'app', label: 'App action', type: 'apps' }),
			],
			{ hidden: ['delete', 'app'] },
		);

		await openMenu();

		const items = screen.getAllByRole('menuitem');
		expect(items).toHaveLength(2);
		expect(items[0]).toHaveTextContent('Edit');
		expect(items[1]).toHaveTextContent('App action');
	});

	it('tells when it opens and closes, and runs the entry chosen (R17)', async () => {
		const edit = action({ id: 'edit', label: 'Edit' });
		const { onChangeMenuVisibility } = renderMenu([edit]);

		await openMenu();

		expect(onChangeMenuVisibility).toHaveBeenLastCalledWith(true);

		await userEvent.click(screen.getByRole('menuitem', { name: /Edit/ }));

		expect(edit.action).toHaveBeenCalled();
		expect(onChangeMenuVisibility).toHaveBeenLastCalledWith(false);
	});

	it('replaces the apps of an encrypted message with an unavailable item (R15)', async () => {
		renderMenu([action({ id: 'edit', label: 'Edit', type: 'management' }), action({ id: 'app', label: 'App action', type: 'apps' })], {
			encrypted: true,
		});

		await openMenu();

		expect(screen.queryByRole('menuitem', { name: /App action/ })).not.toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: /Unavailable/ })).toHaveAttribute('aria-disabled', 'true');
	});

	it('replaces the apps of an encrypted message in the AI menu too (R15)', async () => {
		renderMenu([action({ id: 'ai-summarize', label: 'App action', type: 'apps' })], { encrypted: true });

		await userEvent.click(screen.getByRole('button', { name: 'AI actions' }));

		expect(screen.queryByRole('menuitem', { name: /App action/ })).not.toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: /Unavailable/ })).toHaveAttribute('aria-disabled', 'true');
	});
});
