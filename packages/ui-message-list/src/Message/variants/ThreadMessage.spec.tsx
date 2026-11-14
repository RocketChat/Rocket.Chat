import type { IMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { UserCardContext } from '@rocket.chat/ui-contexts';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ThreadMessage from './ThreadMessage';
import * as stories from './ThreadMessage.stories';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';
import { createMessageSelectionStore } from '../contexts/MessageSelectionContext';

jest.mock('../MessageToolbarHolder', () => ({
	__esModule: true,
	default: ({ context }: { context?: string }) => <div data-testid='toolbar' data-context={context} />,
}));

const message = createFakeMessage<IThreadMessage>({
	_id: 'messageId',
	tmid: 'main',
	msg: 'message body',
	u: { _id: 'bob', username: 'bob', name: 'Bob' },
});
const props = { message, sequential: false, unread: false };

const Throwing = () => {
	throw new Error('cannot render');
};

describe('the row', () => {
	it('renders a focusable list item with its role description and data attributes (R4)', () => {
		render(<ThreadMessage {...props} unread />, {
			wrapper: mockMessageProviders({ root: mockAppRoot().withUser({ _id: 'bob', username: 'bob' } as never) }).wrapper,
		});

		const item = screen.getByRole('listitem');
		expect(item).toHaveAttribute('tabindex', '0');
		expect(item).toHaveAttribute('aria-roledescription', 'thread_message');
		expect(item).toHaveAttribute('id', 'messageId');
		expect(item).toHaveAttribute('data-id', 'messageId');
		expect(item).toHaveAttribute('data-mid', 'messageId');
		expect(item).toHaveAttribute('data-sequential', 'false');
		expect(item).toHaveAttribute('data-own', 'true');
		expect(item).not.toHaveAttribute('aria-busy');
	});

	it('sets data-unread from unread and draws nothing else for it (R32)', () => {
		const { unmount } = render(<ThreadMessage {...props} unread />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByRole('listitem')).toHaveAttribute('data-unread', 'true');
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
		unmount();

		render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByRole('listitem')).toHaveAttribute('data-unread', 'false');
	});

	it('leaves out the avatar and the header of a sequential message and moves the indicators (R9)', () => {
		const pinned = { ...message, pinned: true } as IThreadMessage;
		const { unmount } = render(<ThreadMessage {...props} message={pinned} sequential />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
		expect(screen.queryByText('bob')).not.toBeInTheDocument();
		expect(screen.getByTitle('Message_has_been_pinned')).toBeInTheDocument();
		unmount();

		render(<ThreadMessage {...props} message={pinned} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByRole('figure')).toBeInTheDocument();
		expect(screen.getByText('bob')).toBeInTheDocument();
	});

	it('opens the user info from the avatar, shown only when avatars are on, without the click reaching what is around it (R14)', async () => {
		const openUserInfo = jest.fn();
		const around = jest.fn();
		document.addEventListener('click', around);
		const root = mockAppRoot().wrap((children) => (
			<UserCardContext.Provider value={{ openUserCard: jest.fn(), openUserInfo, closeUserCard: jest.fn(), triggerProps: {} }}>
				{children}
			</UserCardContext.Provider>
		));
		render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders({ root }).wrapper });

		await userEvent.click(screen.getByRole('img', { hidden: true }));
		document.removeEventListener('click', around);

		expect(openUserInfo).toHaveBeenCalledWith('bob');
		expect(around).not.toHaveBeenCalled();
	});

	it('shows no avatar when avatars are off (R14)', () => {
		render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders({ display: { showAvatars: false } }).wrapper });

		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
	});
});

describe('states', () => {
	it('draws a pending message with the pending look (R17)', () => {
		render(<ThreadMessage {...props} message={{ ...message, temp: true }} />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.getByRole('listitem')).toHaveClass('rcx-message--pending');
	});

	it('draws the message being edited or jumped to with the editing look (R18)', () => {
		render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders({ editingMessageId: 'messageId' }).wrapper });

		expect(screen.getByRole('listitem')).toHaveClass('rcx-message--editing');
	});

	it('hides the content of an ignored user until revealed, and again when the user is ignored (R28)', async () => {
		const { wrapper } = mockMessageProviders();
		const { unmount } = render(<ThreadMessage {...props} ignoredUser />, { wrapper });
		expect(screen.queryByText('message body')).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Message_Ignored' }));
		expect(screen.getByText('message body')).toBeInTheDocument();
		unmount();

		const { rerender } = render(<ThreadMessage {...props} />, { wrapper });
		expect(screen.getByText('message body')).toBeInTheDocument();
		rerender(<ThreadMessage {...props} ignoredUser />);
		expect(screen.queryByText('message body')).not.toBeInTheDocument();
	});

	it('does not hide a message that is marked ignored by itself, which the thread list passes as ignoredUser (R28)', () => {
		render(<ThreadMessage {...props} message={{ ...message, ignored: true } as IThreadMessage & IMessage} />, {
			wrapper: mockMessageProviders().wrapper,
		});

		expect(screen.getByText('message body')).toBeInTheDocument();
	});

	it('shows a placeholder for an encrypted message until it is decrypted (R30)', () => {
		render(<ThreadMessage {...props} message={{ ...message, t: 'e2e', e2e: 'pending' } as IThreadMessage} />, {
			wrapper: mockMessageProviders().wrapper,
		});

		expect(screen.getByText('E2E_message_encrypted_placeholder')).toBeInTheDocument();
		expect(screen.queryByText('message body')).not.toBeInTheDocument();
	});

	it('shows a placeholder instead of failing when the content cannot be rendered (R37)', () => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);

		render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders({ renderers: { Markup: Throwing } }).wrapper });

		expect(screen.getByText('Message_could_not_be_displayed')).toBeInTheDocument();
	});
});

describe('selection', () => {
	it('is never selectable (R24)', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole('listitem'));
		act(() => screen.getByRole('listitem').focus());
		await userEvent.keyboard(' ');

		expect(selection.isSelected('messageId')).toBe(false);
		expect(screen.getByRole('figure')).toBeInTheDocument();
	});
});

describe('the toolbar', () => {
	it('renders the toolbar holder for the thread place, or for a call (R39)', () => {
		const { unmount } = render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByTestId('toolbar')).toHaveAttribute('data-context', 'threads');
		unmount();

		render(<ThreadMessage {...props} message={{ ...message, t: 'videoconf' } as IThreadMessage} />, {
			wrapper: mockMessageProviders().wrapper,
		});
		expect(screen.getByTestId('toolbar')).toHaveAttribute('data-context', 'videoconf-threads');
	});

	it('renders no toolbar for a private message (R39)', () => {
		render(<ThreadMessage {...props} message={{ ...message, private: true } as IThreadMessage} />, {
			wrapper: mockMessageProviders().wrapper,
		});

		expect(screen.queryByTestId('toolbar')).not.toBeInTheDocument();
	});
});

describe('known defects', () => {
	// Known defect: ../../../docs/specs/message-variants.md#d6-a-pending-encrypted-message-in-a-thread-keeps-its-toolbar
	it.skip('renders no toolbar for an encrypted message that is not decrypted yet', () => {
		render(<ThreadMessage {...props} message={{ ...message, t: 'e2e', e2e: 'pending' } as IThreadMessage} />, {
			wrapper: mockMessageProviders().wrapper,
		});

		expect(screen.queryByTestId('toolbar')).not.toBeInTheDocument();
	});

	// Known defect: ../../../docs/specs/message-variants.md#d7-a-system-or-thread-message-has-no-accessible-name
	it.skip('names the row of a thread message', () => {
		render(<ThreadMessage {...props} />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.getByRole('listitem', { name: /message body/ })).toBeInTheDocument();
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations (R8)', async (_storyName, Story) => {
		const { container } = render(<Story />);

		expect(await axe(container)).toHaveNoViolations();
	});
});
