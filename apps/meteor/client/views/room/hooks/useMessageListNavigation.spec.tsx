/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Message navigation requires focusable listitems, matching the room message markup. */
import { FocusScope } from '@react-aria/focus';
import { useToolbar } from '@react-aria/toolbar';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';

import { useMessageListNavigation } from './useMessageListNavigation';

const MessageActions = () => {
	const ref = useRef<HTMLDivElement>(null);
	const { toolbarProps } = useToolbar({ 'aria-label': 'Message actions' }, ref);

	return (
		<div ref={ref} {...toolbarProps}>
			<button>Add reaction</button>
			<button>Reply</button>
		</div>
	);
};

const UserMessage = ({ message }: { message: string }) => {
	const [focused, setFocused] = useState(false);
	return (
		<div
			role='listitem'
			tabIndex={0}
			aria-label={message}
			onFocus={() => setFocused(true)}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
			}}
		>
			<button>{`Author of ${message}`}</button>
			{message}
			{focused && <MessageActions />}
		</div>
	);
};

const MessageList = ({ withThread = false }: { withThread?: boolean }) => {
	const { messageListRef } = useMessageListNavigation();

	return (
		<div role='list' ref={messageListRef}>
			<div role='listitem' tabIndex={0} className='rcx-message-system'>
				Channel created
			</div>
			{['msg1', 'msg2'].map((message) => (
				<UserMessage key={message} message={message} />
			))}
			{withThread && (
				<div role='listitem' tabIndex={0} aria-label='thread reply' className='rcx-message-thread'>
					thread reply
				</div>
			)}
		</div>
	);
};

const setup = async (withThread = false) => {
	const user = userEvent.setup();
	render(
		<FocusScope>
			<header className='rcx-room-header'>
				<button>Favorite</button>
			</header>
			<MessageList withThread={withThread} />
			<textarea aria-label='Message composer' />
		</FocusScope>,
	);
	await user.click(screen.getByRole('textbox', { name: 'Message composer' }));
	await user.tab({ shift: true });
	return user;
};

beforeAll(() => {
	// jsdom does not implement keyboard focus visibility.
	jest.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function matches(this: HTMLElement, selector: string) {
		return selector === ':focus-visible' ? true : Element.prototype.matches.call(this, selector);
	});
});

afterAll(() => {
	jest.restoreAllMocks();
});

it('focuses the latest message when entering the list from the composer', async () => {
	await setup();

	expect(screen.getByRole('listitem', { name: 'msg2' })).toHaveFocus();
});

it('navigates up through the messages and back down with the arrow keys', async () => {
	const user = await setup();

	await user.keyboard('{ArrowUp}');
	expect(screen.getByRole('listitem', { name: 'msg1' })).toHaveFocus();
	await user.keyboard('{ArrowUp}');
	expect(screen.getByText('Channel created')).toHaveFocus();
	await user.keyboard('{ArrowDown}');
	expect(screen.getByRole('listitem', { name: 'msg1' })).toHaveFocus();
});

it('keeps the focus on the first message when pressing arrow up', async () => {
	const user = await setup();
	await user.keyboard('{ArrowUp}{ArrowUp}');
	expect(screen.getByText('Channel created')).toHaveFocus();

	await user.keyboard('{ArrowUp}');
	expect(screen.getByText('Channel created')).toHaveFocus();
});

it('moves to the room header with shift tab and restores the last focused message on reentry', async () => {
	const user = await setup();
	await user.keyboard('{ArrowUp}');
	expect(screen.getByRole('listitem', { name: 'msg1' })).toHaveFocus();

	await user.tab({ shift: true });
	expect(screen.getByRole('button', { name: 'Favorite' })).toHaveFocus();

	await user.tab();
	expect(screen.getByRole('listitem', { name: 'msg1' })).toHaveFocus();
});

it('moves to the composer with tab from a system message', async () => {
	const user = await setup();
	await user.keyboard('{ArrowUp}{ArrowUp}');
	expect(screen.getByText('Channel created')).toHaveFocus();

	await user.tab();
	expect(screen.getByRole('textbox', { name: 'Message composer' })).toHaveFocus();
});

it('moves to the composer with tab from a thread message', async () => {
	const user = await setup(true);

	await user.tab();
	expect(screen.getByRole('textbox', { name: 'Message composer' })).toHaveFocus();
});

it('moves into the message toolbar with tab and out with a second tab', async () => {
	const user = await setup();
	await user.keyboard('{ArrowUp}');
	expect(screen.getByRole('listitem', { name: 'msg1' })).toHaveFocus();

	await user.tab();
	expect(screen.getByRole('button', { name: 'Author of msg1' })).toHaveFocus();
	await user.tab();
	expect(within(screen.getByRole('listitem', { name: 'msg1' })).getByRole('button', { name: 'Add reaction' })).toHaveFocus();
	await user.tab();
	expect(screen.getByRole('listitem', { name: 'msg2' })).toHaveFocus();

	await user.tab();
	await user.tab();
	expect(within(screen.getByRole('listitem', { name: 'msg2' })).getByRole('button', { name: 'Add reaction' })).toHaveFocus();
	await user.tab();
	expect(screen.getByRole('textbox', { name: 'Message composer' })).toHaveFocus();
});
