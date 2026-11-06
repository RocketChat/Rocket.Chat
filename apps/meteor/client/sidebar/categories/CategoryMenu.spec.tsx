import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps } from 'react';

import CategoryMenu from './CategoryMenu';
import { usePersistCategoriesMutation } from './hooks/usePersistCategoriesMutation';
import { useUserSidebarCategories } from './hooks/useUserSidebarCategories';

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	useIsEnterprise: () => ({ data: { isEnterprise: true } }),
}));

jest.mock('./hooks/usePersistCategoriesMutation', () => ({
	usePersistCategoriesMutation: jest.fn(),
}));

jest.mock('./hooks/useUserSidebarCategories', () => ({
	useUserSidebarCategories: jest.fn(),
}));

jest.mock('./hooks/useCategoryModals', () => ({
	useCategoryModals: () => ({ openCreate: jest.fn(), openManage: jest.fn(), openDelete: jest.fn() }),
}));

jest.mock('./hooks/useMoveRoomCategory', () => ({
	useMoveRoomCategory: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('../../navbar/NavBarPagesGroup/hooks/useCreateNewItems', () => ({
	useCreateNewItems: () => [],
}));

const readMessages = jest.fn(async () => undefined);

const appRoot = mockAppRoot()
	.withEndpoint('POST', '/v1/subscriptions.read', readMessages as any)
	.withTranslations('en', 'core', {
		Options: 'Options',
		Unreads: 'Unreads',
		Mark_read: 'Mark read',
		Mark_rooms_as_read: 'Mark rooms as read',
		Unread_rooms_in_group_become_read_one: '{{count}} unread room in “{{group}}” becomes read, threads included.',
		Unread_rooms_in_group_become_read_other: '{{count}} unread rooms in “{{group}}” become read, threads included.',
		Rooms_marked_read_one: '{{count}} room marked read',
		Rooms_marked_read_other: '{{count}} rooms marked read',
		Cancel: 'Cancel',
		Always_display: 'Always display',
		Keep_on_top: 'Keep on top',
		Move_up: 'Move up',
		Move_down: 'Move down',
	})
	.build();

beforeEach(() => {
	readMessages.mockClear();
	jest.mocked(usePersistCategoriesMutation).mockReturnValue({ mutate: jest.fn() } as any);
	jest.mocked(useUserSidebarCategories).mockReturnValue({
		rawCategories: [{ _id: 'Channels', name: 'Channels', default: true }],
		customCategories: [],
	});
});

const rooms = [
	{ rid: 'read-one', t: 'c', name: 'read-one', unread: 0, alert: false },
	{ rid: 'unread-one', t: 'c', name: 'unread-one', unread: 2, alert: true },
	{ rid: 'thread-one', t: 'p', name: 'thread-one', unread: 0, alert: false, tunread: ['m1'] },
] as SubscriptionWithRoom[];

const renderMenu = (overrides: Partial<ComponentProps<typeof CategoryMenu>> = {}) =>
	render(
		<CategoryMenu
			groupKey='Channels'
			groupTitle='Channels'
			rooms={rooms}
			showUnreads={false}
			keepUnreadsOnTop={false}
			canMoveUp
			canMoveDown
			onMoveUp={jest.fn()}
			onMoveDown={jest.fn()}
			{...overrides}
		/>,
		{ wrapper: appRoot },
	);

describe('the Mark read item', () => {
	it('is disabled while the group has nothing unread', async () => {
		renderMenu({ rooms: [rooms[0]] });
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));

		const item = await screen.findByRole('menuitemcheckbox', { name: 'Mark read' });
		expect(item).toHaveAttribute('aria-disabled', 'true');

		await userEvent.click(item);

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('says how many rooms become read, then marks each unread one read with its threads', async () => {
		renderMenu({ rooms });
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));
		await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Mark read' }));

		const dialog = await screen.findByRole('dialog', { name: 'Mark rooms as read' });
		expect(dialog).toHaveTextContent('2 unread rooms in “Channels” become read, threads included.');
		expect(readMessages).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole('button', { name: 'Mark read' }));

		await waitFor(() => expect(readMessages).toHaveBeenCalledTimes(2));
		expect(readMessages).toHaveBeenCalledWith({ rid: 'unread-one', readThreads: true });
		expect(readMessages).toHaveBeenCalledWith({ rid: 'thread-one', readThreads: true });
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it('keeps the modal up with a busy button until every room is read, and takes no second run meanwhile', async () => {
		let finish: () => void = () => undefined;
		readMessages.mockImplementation(
			() =>
				new Promise<undefined>((resolve) => {
					finish = () => resolve(undefined);
				}),
		);

		renderMenu({ rooms });
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));
		await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Mark read' }));
		const dialog = await screen.findByRole('dialog', { name: 'Mark rooms as read' });
		expect(await axe(dialog)).toHaveNoViolations();

		await userEvent.click(screen.getByRole('button', { name: 'Mark read' }));

		expect(screen.getByRole('dialog', { name: 'Mark rooms as read' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Mark read' })).toBeDisabled();
		await userEvent.click(await screen.findByRole('button', { name: 'Options' }));
		expect(await screen.findByRole('menuitemcheckbox', { name: 'Mark read' })).toHaveAttribute('aria-disabled', 'true');

		finish();
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		readMessages.mockImplementation(async () => undefined);
	});
});
