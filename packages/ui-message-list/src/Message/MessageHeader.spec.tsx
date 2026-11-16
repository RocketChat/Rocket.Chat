import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { UserCardContext } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import MessageHeader from './MessageHeader';
import { createMessageSelectionStore } from './contexts/MessageSelectionContext';
import { mockMessageProviders } from '../../tests/utils/mockMessageProviders';

const message: IMessage = createFakeMessage({
	_id: 'messageId',
	rid: 'roomId',
	u: { _id: 'alex', username: 'alex.smith', name: 'Alex Smith' },
	ts: new Date('2021-10-27T10:00:00.000Z'),
});

const realNames = () => mockAppRoot().withSetting('UI_Use_Real_Name', true);

const withUserCard = (userCard: Partial<React.ContextType<typeof UserCardContext>>) => (children: ReactNode) => (
	<UserCardContext.Provider
		value={{ openUserCard: jest.fn(), openUserInfo: jest.fn(), closeUserCard: jest.fn(), triggerProps: {}, ...userCard }}
	>
		{children}
	</UserCardContext.Provider>
);

describe('the author', () => {
	it('shows the alias or else the display name as a trigger for the user info and the card, and none while selecting (R11)', async () => {
		const openUserInfo = jest.fn();
		const openUserCard = jest.fn();
		const root = realNames().wrap(withUserCard({ openUserInfo, openUserCard }));

		const { unmount } = render(<MessageHeader message={message} />, { wrapper: mockMessageProviders({ root }).wrapper });
		const trigger = screen.getByRole('button', { name: /Alex Smith/ });
		await userEvent.hover(trigger);
		await userEvent.click(trigger);

		expect(openUserCard).toHaveBeenCalledWith(expect.anything(), 'alex.smith');
		expect(openUserInfo).toHaveBeenCalledWith('alex.smith');
		unmount();

		render(<MessageHeader message={{ ...message, alias: 'Bridge' }} />, { wrapper: mockMessageProviders({ root }).wrapper });
		expect(screen.getByText('Bridge')).toBeInTheDocument();
		expect(screen.queryByText('Alex Smith')).not.toBeInTheDocument();
	});

	it('is not a trigger while messages are being selected (R11)', () => {
		render(<MessageHeader message={message} />, {
			wrapper: mockMessageProviders({ root: realNames(), selection: createMessageSelectionStore({ isSelecting: true }) }).wrapper,
		});

		expect(screen.getByText('Alex Smith')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('shows the username only when usernames, real names and a different name all apply (R12)', () => {
		const { unmount } = render(<MessageHeader message={message} />, {
			wrapper: mockMessageProviders({ root: realNames(), display: { showUsername: true, showRealName: true } }).wrapper,
		});
		expect(screen.getByText('@alex.smith')).toBeInTheDocument();
		expect(screen.getByText('Alex Smith')).toHaveAttribute('data-username', 'alex.smith');
		unmount();

		for (const display of [
			{ showUsername: false, showRealName: true },
			{ showUsername: true, showRealName: false },
		]) {
			const view = render(<MessageHeader message={message} />, { wrapper: mockMessageProviders({ root: realNames(), display }).wrapper });
			expect(screen.queryByText('@alex.smith')).not.toBeInTheDocument();
			view.unmount();
		}

		render(<MessageHeader message={{ ...message, u: { ...message.u, name: 'alex.smith' } }} />, {
			wrapper: mockMessageProviders({ root: realNames(), display: { showUsername: true, showRealName: true } }).wrapper,
		});
		expect(screen.queryByText('@alex.smith')).not.toBeInTheDocument();
	});

	it('writes the username of a federated author without its leading @ (R12)', () => {
		render(<MessageHeader message={{ ...message, u: { _id: 'fed', username: '@alex:matrix.org', name: 'Alex' } }} />, {
			wrapper: mockMessageProviders({ root: realNames(), display: { showUsername: true, showRealName: true } }).wrapper,
		});

		expect(screen.getByText('@alex:matrix.org')).toBeInTheDocument();
		expect(screen.queryByText('@@alex:matrix.org')).not.toBeInTheDocument();
	});
});

describe('the time and the private marker', () => {
	it('shows the time with the date and time as its title (R11)', () => {
		render(<MessageHeader message={message} />, {
			wrapper: mockMessageProviders({ display: { formatTime: () => '10:00', formatDateAndTime: () => 'Oct 27, 10:00' } }).wrapper,
		});

		expect(screen.getByText('10:00')).toHaveAttribute('title', 'Oct 27, 10:00');
	});

	it('says that only the viewer can see a private message (R11)', () => {
		render(<MessageHeader message={{ ...message, private: true } as IMessage} />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.getByText('Only_you_can_see_this_message')).toBeInTheDocument();
	});
});

describe('the roles', () => {
	const labels = { workspaceRoles: ['Admin'], roomRoles: ['Owner', 'Leader'] };

	it('shows the roles the place resolved, in a tag for each scope, and a bot tag, only when roles are on (R13)', () => {
		const usePlaceUserRoles = jest.fn(() => labels);
		const { unmount } = render(<MessageHeader message={{ ...message, bot: { i: 'bot' } }} />, {
			wrapper: mockMessageProviders({ display: { showRoles: true }, relatedData: { usePlaceUserRoles } }).wrapper,
		});

		expect(usePlaceUserRoles).toHaveBeenCalledWith('alex', 'roomId');
		expect(screen.getByTitle('Workspace_roles: Admin')).toHaveTextContent('Admin');
		expect(screen.getByTitle('Room_roles: Owner, Leader')).toHaveTextContent('Owner +1');
		expect(screen.getByText('Bot')).toBeInTheDocument();
		unmount();

		render(<MessageHeader message={message} />, {
			wrapper: mockMessageProviders({ display: { showRoles: false }, relatedData: { usePlaceUserRoles: () => labels } }).wrapper,
		});
		expect(screen.queryByText('Admin')).not.toBeInTheDocument();
	});

	it("looks the roles up in the message's own room when the place resolved none for it (R13)", () => {
		const useUserRoles = jest.fn(() => labels);
		render(<MessageHeader message={message} />, {
			wrapper: mockMessageProviders({ display: { showRoles: true }, relatedData: { usePlaceUserRoles: () => undefined, useUserRoles } })
				.wrapper,
		});

		expect(useUserRoles).toHaveBeenCalledWith('alex', 'roomId', { enabled: true });
		expect(screen.getByText('Admin')).toBeInTheDocument();
	});

	it('asks for no roles while roles are off, and shows none for an author without roles who is not a bot (R13)', () => {
		const useUserRoles = jest.fn(() => ({ workspaceRoles: [], roomRoles: [] }));
		const usePlaceUserRoles = jest.fn(() => undefined);
		const view = render(<MessageHeader message={message} />, {
			wrapper: mockMessageProviders({ display: { showRoles: false }, relatedData: { usePlaceUserRoles, useUserRoles } }).wrapper,
		});
		expect(usePlaceUserRoles).not.toHaveBeenCalled();
		expect(useUserRoles).not.toHaveBeenCalled();
		view.unmount();

		render(<MessageHeader message={message} />, {
			wrapper: mockMessageProviders({ display: { showRoles: true }, relatedData: { usePlaceUserRoles, useUserRoles } }).wrapper,
		});
		expect(screen.queryByTitle(/_roles/)).not.toBeInTheDocument();
		expect(screen.queryByText('Bot')).not.toBeInTheDocument();
	});
});
