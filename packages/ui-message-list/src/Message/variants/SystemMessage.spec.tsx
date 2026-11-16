import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { UserCardContext } from '@rocket.chat/ui-contexts';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import SystemMessage from './SystemMessage';
import * as stories from './SystemMessage.stories';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';
import { createMessageSelectionStore } from '../contexts/MessageSelectionContext';

const root = () =>
	mockAppRoot().withTranslations('en', 'core', {
		changed_room_description_to__room_description_: 'changed room description to: {{room_description}}',
	});

const createBaseMessage = (msg: string): IMessage =>
	createFakeMessage({
		_id: 'systemId',
		t: 'room_changed_description',
		msg,
		groupable: false,
		u: { _id: 'bob', username: 'bob', name: 'Bob' },
	});

describe('the row', () => {
	it('renders a focusable list item with its role description and type (R3)', () => {
		render(<SystemMessage message={createBaseMessage('test')} />, { wrapper: mockMessageProviders({ root: root() }).wrapper });

		const item = screen.getByRole('listitem');
		expect(item).toHaveAttribute('tabindex', '0');
		expect(item).toHaveAttribute('aria-roledescription', 'system_message');
		expect(item).toHaveAttribute('data-system-message-type', 'room_changed_description');
	});

	it('passes the other props to its root (R6)', () => {
		render(<SystemMessage message={createBaseMessage('test')} data-tmid='thread' />, {
			wrapper: mockMessageProviders({ root: root() }).wrapper,
		});

		expect(screen.getByRole('listitem')).toHaveAttribute('data-tmid', 'thread');
	});
});

describe('what it shows', () => {
	it('shows the name, the text of the type, the time, the attachments and the action links (R35)', () => {
		const message = {
			...createBaseMessage('& test &'),
			attachments: [{ title: 'Pipeline', text: 'All checks passed.' }],
			actionLinks: [{ icon: 'video', i18nLabel: 'Join_call', label: 'Join call', method_id: 'joinJitsiCall', params: '' }],
		} as IMessage;

		render(<SystemMessage message={message} />, {
			wrapper: mockMessageProviders({ root: root(), display: { formatTime: () => '10:00', formatDateAndTime: () => 'Oct 27, 10:00' } })
				.wrapper,
		});

		expect(screen.getByText('bob')).toBeInTheDocument();
		expect(screen.getAllByRole('document').map((element) => element.getAttribute('aria-roledescription'))).toContain('system_message_body');
		expect(screen.getByText('changed room description to: & test &')).toBeInTheDocument();
		expect(screen.queryByText('changed room description to: &amp; test &amp;')).not.toBeInTheDocument();
		expect(screen.getByText('10:00')).toHaveAttribute('title', 'Oct 27, 10:00');
		expect(screen.getByText('Pipeline')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Join_call' })).toBeInTheDocument();
	});

	it('draws no text for an unknown type, and does not inject html (R35)', () => {
		const { unmount } = render(<SystemMessage message={createBaseMessage('<button title="test-title">OK</button>')} />, {
			wrapper: mockMessageProviders({ root: root() }).wrapper,
		});
		expect(screen.queryByTitle('test-title')).not.toBeInTheDocument();
		expect(screen.getByText('changed room description to: <button title="test-title">OK</button>')).toBeInTheDocument();
		unmount();

		render(<SystemMessage message={{ ...createBaseMessage('x'), t: 'not-a-system-type' } as unknown as IMessage} />, {
			wrapper: mockMessageProviders({ root: root() }).wrapper,
		});
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		expect(screen.queryByRole('document')).not.toBeInTheDocument();
		expect(screen.queryByText('Message_could_not_be_displayed')).not.toBeInTheDocument();
	});

	it('shows a placeholder for content that cannot be rendered, and nothing else of the row fails (R37)', () => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const message = { ...createBaseMessage('test'), actionLinks: [null] } as unknown as IMessage;

		render(<SystemMessage message={message} />, { wrapper: mockMessageProviders({ root: root() }).wrapper });

		expect(screen.getByText('Message_could_not_be_displayed')).toBeInTheDocument();
		expect(screen.getByRole('listitem')).toBeInTheDocument();
		expect(screen.getByText('changed room description to: test')).toBeInTheDocument();
	});
});

describe('the author', () => {
	const author = { _id: 'alex', username: 'alex.smith', name: 'Alex Smith' };
	const realNames = () => root().withSetting('UI_Use_Real_Name', true);

	it('shows the display name as a trigger for the user info and the card, and none while selecting (R11)', async () => {
		const openUserInfo = jest.fn();
		const openUserCard = jest.fn();
		const wrapped = () =>
			realNames().wrap((children) => (
				<UserCardContext.Provider value={{ openUserCard, openUserInfo, closeUserCard: jest.fn(), triggerProps: {} }}>
					{children}
				</UserCardContext.Provider>
			));
		const message = { ...createBaseMessage('x'), u: author } as IMessage;

		const { unmount } = render(<SystemMessage message={message} />, { wrapper: mockMessageProviders({ root: wrapped() }).wrapper });
		const trigger = screen.getByRole('button', { name: /Alex Smith/ });
		await userEvent.hover(trigger);
		await userEvent.click(trigger);
		expect(openUserCard).toHaveBeenCalledWith(expect.anything(), 'alex.smith');
		expect(openUserInfo).toHaveBeenCalledWith('alex.smith');
		unmount();

		render(<SystemMessage message={message} />, {
			wrapper: mockMessageProviders({ root: wrapped(), selection: createMessageSelectionStore({ isSelecting: true }) }).wrapper,
		});
		expect(screen.queryByRole('button', { name: /Alex Smith/ })).not.toBeInTheDocument();
	});

	it("shows the username next to the author's name under the same rule as a header (R12)", () => {
		const message = { ...createBaseMessage('x'), u: author } as IMessage;
		const { unmount } = render(<SystemMessage message={message} />, {
			wrapper: mockMessageProviders({ root: realNames(), display: { showUsername: true, showRealName: true } }).wrapper,
		});
		expect(screen.getByText('@alex.smith')).toBeInTheDocument();
		unmount();

		const hidden = render(<SystemMessage message={message} />, {
			wrapper: mockMessageProviders({ root: realNames(), display: { showUsername: false, showRealName: true } }).wrapper,
		});
		expect(screen.queryByText('@alex.smith')).not.toBeInTheDocument();
		hidden.unmount();

		render(<SystemMessage message={{ ...message, u: { ...author, name: 'alex.smith' } } as IMessage} />, {
			wrapper: mockMessageProviders({ root: realNames(), display: { showUsername: true, showRealName: true } }).wrapper,
		});
		expect(screen.queryByText('@alex.smith')).not.toBeInTheDocument();
	});

	it('shows a small avatar only when avatars are on and messages are not being selected (R14)', () => {
		const off = render(<SystemMessage message={createBaseMessage('test')} />, {
			wrapper: mockMessageProviders({ root: root(), display: { showAvatars: false } }).wrapper,
		});
		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
		off.unmount();

		const selecting = render(<SystemMessage message={createBaseMessage('test')} />, {
			wrapper: mockMessageProviders({ root: root(), selection: createMessageSelectionStore({ isSelecting: true }) }).wrapper,
		});
		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
		selecting.unmount();

		render(<SystemMessage message={createBaseMessage('test')} />, { wrapper: mockMessageProviders({ root: root() }).wrapper });
		expect(screen.getByRole('figure')).toBeInTheDocument();
	});
});

describe('selection mode', () => {
	it('shows a checkbox, toggles by a click and by Space and Enter, and keeps the click on the row (R19, R20, R21)', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		const around = jest.fn();
		document.addEventListener('click', around);
		render(<SystemMessage message={createBaseMessage('test')} />, { wrapper: mockMessageProviders({ root: root(), selection }).wrapper });

		expect(screen.getByRole('checkbox', { name: 'Select_message_from_user_with_preview' })).not.toBeChecked();
		await userEvent.click(screen.getByRole('listitem'));
		document.removeEventListener('click', around);
		expect(selection.isSelected('systemId')).toBe(true);
		expect(around).not.toHaveBeenCalled();

		act(() => screen.getByRole('listitem').focus());
		await userEvent.keyboard(' ');
		expect(selection.isSelected('systemId')).toBe(false);
		await userEvent.keyboard('{Enter}');
		expect(selection.isSelected('systemId')).toBe(true);
	});

	it('ignores other keys while selecting (R21)', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		render(<SystemMessage message={createBaseMessage('test')} />, { wrapper: mockMessageProviders({ root: root(), selection }).wrapper });

		act(() => screen.getByRole('listitem').focus());
		await userEvent.keyboard('a');

		expect(selection.isSelected('systemId')).toBe(false);
	});

	it('does not select on a click or Enter outside selection mode (R20, R21)', async () => {
		const selection = createMessageSelectionStore();
		render(<SystemMessage message={createBaseMessage('test')} />, { wrapper: mockMessageProviders({ root: root(), selection }).wrapper });

		await userEvent.click(screen.getByRole('listitem'));
		act(() => screen.getByRole('listitem').focus());
		await userEvent.keyboard('{Enter}');

		expect(selection.isSelected('systemId')).toBe(false);
	});

	it('shows no checkbox outside selection mode (R19)', () => {
		render(<SystemMessage message={createBaseMessage('test')} />, { wrapper: mockMessageProviders({ root: root() }).wrapper });

		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
	});
});

describe('known defects', () => {
	// Known defect: ../../../docs/specs/message-variants.md#d7-a-system-or-thread-message-has-no-accessible-name
	it.skip('names the row of a system message', () => {
		render(<SystemMessage message={createBaseMessage('test')} />, { wrapper: mockMessageProviders({ root: root() }).wrapper });

		expect(screen.getByRole('listitem', { name: /Bob/ })).toBeInTheDocument();
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations (R8)', async (_storyName, Story) => {
		const { container } = render(<Story />);

		expect(await axe(container)).toHaveNoViolations();
	});
});
