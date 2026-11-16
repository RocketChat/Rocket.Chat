import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { LayoutContext } from '@rocket.chat/ui-contexts';
import { composeStories } from '@storybook/react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';

import type { MessageToolbarProps } from './MessageToolbar';
import MessageToolbar from './MessageToolbar';
import * as stories from './MessageToolbar.stories';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';
import type { MessageActionConfig, MessageActionContext } from '../contexts/MessageAction';
import type { MessageToolbarContextValue } from '../contexts/MessageToolbarContext';

const createRoot = () =>
	mockAppRoot().withJohnDoe().withSetting('Threads_enabled', true).withTranslations('en', 'core', {
		Message_actions: 'Message actions',
		More: 'More',
		AI_Actions: 'AI actions',
		Add_Reaction: 'Add reaction',
		Quote: 'Quote',
		Reply_in_thread: 'Reply in thread',
		Forward_message: 'Forward message',
		Jump_to_message: 'Jump to message',
		Edit: 'Edit',
		Delete: 'Delete',
	});

const room = { _id: 'room', t: 'c' } as IRoom;
const subscription = { _id: 'subscription', rid: room._id, t: 'c' } as ISubscription;
const message = createFakeMessage({ _id: 'message', rid: room._id });

const renderToolbar = ({
	toolbar,
	props,
	root = createRoot(),
}: {
	toolbar?: Partial<MessageToolbarContextValue>;
	props?: Partial<MessageToolbarProps>;
	root?: ReturnType<typeof createRoot>;
} = {}) => {
	const providers = mockMessageProviders({ root, toolbar });

	render(<MessageToolbar message={message} room={room} subscription={subscription} onChangeMenuVisibility={jest.fn()} {...props} />, {
		wrapper: providers.wrapper,
	});

	return providers;
};

const menuAction = ({
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

const toolbarButtonNames = () =>
	within(screen.getByRole('toolbar', { name: 'Message actions' }))
		.getAllByRole('button')
		.map((button) => button.getAttribute('aria-label') ?? button.getAttribute('title'));

const quickReactions = { useQuickReactions: () => ['+1', 'smile', 'tada'] };

describe('MessageToolbar', () => {
	it.each<[MessageActionContext, string[]]>([
		['message', ['+1', 'smile', 'tada', 'Add reaction', 'Quote', 'Reply in thread', 'Forward message']],
		['message-mobile', ['+1', 'smile', 'tada', 'Add reaction', 'Quote', 'Reply in thread', 'Forward message', 'Jump to message']],
		['threads', ['+1', 'smile', 'tada', 'Add reaction', 'Quote', 'Forward message', 'Jump to message']],
		['videoconf', ['+1', 'smile', 'tada', 'Add reaction', 'Reply in thread']],
		['videoconf-threads', ['+1', 'smile', 'tada', 'Add reaction', 'Jump to message']],
		['federated', ['+1', 'smile', 'tada', 'Add reaction', 'Quote', 'Reply in thread']],
		['pinned', ['Jump to message']],
		['direct', ['Jump to message']],
		['starred', ['Jump to message']],
		['mentions', ['Jump to message']],
		['search', ['Jump to message']],
	])('shows the inline items of the %s place (R4)', (messageContext, expected) => {
		renderToolbar({ toolbar: quickReactions, props: { messageContext } });

		expect(toolbarButtonNames()).toEqual(expected);
	});

	it('shows the jump of a direct room only to a viewer who is subscribed (R4)', () => {
		renderToolbar({ props: { messageContext: 'direct', subscription: undefined } });

		expect(screen.queryByRole('button', { name: 'Jump to message' })).not.toBeInTheDocument();
	});

	it('infers the place from the message and the room, and lets a given place win (R5)', () => {
		const useMenuActions = jest.fn(() => []);
		const threadMessage = createFakeMessage({ _id: 'reply', rid: room._id, tmid: 'parent' });
		const callMessage = createFakeMessage({ _id: 'call', rid: room._id, t: 'videoconf' });
		const federatedRoom = { ...room, federated: true, federation: { version: 1 } } as unknown as IRoom;

		renderToolbar({ toolbar: { useMenuActions }, props: { message: threadMessage } });
		expect(useMenuActions).toHaveBeenLastCalledWith(threadMessage, { room, subscription, context: 'threads' });

		renderToolbar({ toolbar: { useMenuActions }, props: { message: callMessage } });
		expect(useMenuActions).toHaveBeenLastCalledWith(callMessage, { room, subscription, context: 'videoconf' });

		renderToolbar({ toolbar: { useMenuActions }, props: { message: threadMessage, room: federatedRoom } });
		expect(useMenuActions).toHaveBeenLastCalledWith(threadMessage, { room: federatedRoom, subscription, context: 'federated' });

		renderToolbar({ toolbar: { useMenuActions }, props: { message, messageContext: 'search' } });
		expect(useMenuActions).toHaveBeenLastCalledWith(message, { room, subscription, context: 'search' });

		renderToolbar({ toolbar: { useMenuActions }, props: { message } });
		expect(useMenuActions).toHaveBeenLastCalledWith(message, { room, subscription, context: 'message' });
	});

	describe('reactions', () => {
		const reactionShown = () => screen.queryByRole('button', { name: 'Add reaction' }) !== null;
		const nativeFederated = { ...room, federated: true, federation: { version: 1 } } as unknown as IRoom;
		const foreignFederated = { ...room, federated: true } as unknown as IRoom;

		it('are offered to a viewer who can post (R6)', () => {
			renderToolbar();

			expect(reactionShown()).toBe(true);
		});

		it.each<[string, Partial<MessageToolbarProps>]>([
			['in a federated room that is not native', { room: foreignFederated }],
			['in the omnichannel', { room: { ...room, t: 'l' } as IRoom }],
			['without a subscription', { subscription: undefined }],
			['on a private message', { message: createFakeMessage({ rid: room._id, private: true } as never) }],
			['in a read-only room', { room: { ...room, ro: true } }],
			['for a muted viewer', { room: { ...room, muted: ['john.doe'] } }],
		])('are hidden %s (R6)', (_name, props) => {
			renderToolbar({ props });

			expect(reactionShown()).toBe(false);
		});

		it('are hidden where the toolbar context offers no reactions (R6)', () => {
			renderToolbar({ toolbar: { useQuickReactions: () => undefined } });

			expect(reactionShown()).toBe(false);
		});

		it('are hidden from a viewer who is not logged in (R6)', () => {
			renderToolbar({
				root: mockAppRoot()
					.withSetting('Threads_enabled', true)
					.withTranslations('en', 'core', { Message_actions: 'Message actions', Add_Reaction: 'Add reaction' }) as never,
			});

			expect(reactionShown()).toBe(false);
		});

		it('are offered in a native federated room (R6)', () => {
			renderToolbar({ props: { room: nativeFederated } });
			expect(reactionShown()).toBe(true);
		});

		it('are offered in a read-only room that allows reactions (R6)', () => {
			renderToolbar({ props: { room: { ...room, ro: true, reactWhenReadOnly: true } } });

			expect(reactionShown()).toBe(true);
		});

		it('are offered in a read-only room to a viewer who is unmuted there or may post (R6)', () => {
			renderToolbar({ props: { room: { ...room, ro: true, unmuted: ['john.doe'] } } });
			expect(reactionShown()).toBe(true);
		});

		it('are offered in a read-only room to a viewer with the post-readonly permission (R6)', () => {
			renderToolbar({ props: { room: { ...room, ro: true } }, root: createRoot().withPermission('post-readonly') });

			expect(reactionShown()).toBe(true);
		});
	});

	it.each<[string, Partial<MessageToolbarProps>, string]>([
		['without a subscription', { subscription: undefined }, 'Quote'],
		['in a federated room that is not native', { room: { ...room, federated: true } as unknown as IRoom }, 'Quote'],
		['without a subscription', { subscription: undefined }, 'Reply in thread'],
		['in the omnichannel', { room: { ...room, t: 'l' } as IRoom }, 'Reply in thread'],
		['in a federated room that is not native', { room: { ...room, federated: true } as unknown as IRoom }, 'Reply in thread'],
	])('hides quote and reply in thread where they do not apply (%s, %s) (R7)', (_name, props, name) => {
		renderToolbar({ props });

		expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
	});

	it('hides reply in thread when threads are disabled (R7)', () => {
		renderToolbar({ root: createRoot().withSetting('Threads_enabled', false) });

		expect(screen.queryByRole('button', { name: 'Reply in thread' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Quote' })).toBeInTheDocument();
	});

	it('toggles a quick reaction and counts it, and opens the picker with a way to learn it closed (R9)', async () => {
		const countQuickReaction = jest.fn();
		const { interactions } = renderToolbar({
			toolbar: { useQuickReactions: () => ['+1', 'smile'], useCountQuickReaction: () => countQuickReaction },
		});

		await userEvent.click(screen.getByRole('button', { name: 'smile' }));

		expect(interactions.toggleReaction).toHaveBeenCalledWith(message, ':smile:');
		expect(countQuickReaction).toHaveBeenCalledWith('smile');
		expect(countQuickReaction).toHaveBeenCalledTimes(1);

		await userEvent.click(screen.getByRole('button', { name: 'Add reaction' }));

		expect(interactions.openReactionPicker).toHaveBeenCalledWith(expect.anything(), message, { onClose: expect.any(Function) });
		expect(countQuickReaction).toHaveBeenCalledTimes(1);
	});

	it('keeps a click on the button that adds a reaction from reaching the message (R9)', async () => {
		const onMessageClick = jest.fn();
		const { wrapper } = mockMessageProviders({ root: createRoot() });
		render(
			<div role='presentation' onClick={onMessageClick}>
				<MessageToolbar message={message} room={room} subscription={subscription} onChangeMenuVisibility={jest.fn()} />
			</div>,
			{ wrapper },
		);

		await userEvent.click(screen.getByRole('button', { name: 'Add reaction' }));

		expect(onMessageClick).not.toHaveBeenCalled();
	});

	it('shows every quick reaction it is offered (R9)', () => {
		renderToolbar({ toolbar: { useQuickReactions: () => ['+1', 'smile', 'tada', 'rocket'] } });

		expect(toolbarButtonNames().slice(0, 4)).toEqual(['+1', 'smile', 'tada', 'rocket']);
	});

	it('holds the toolbar open while the reaction picker is (R3)', async () => {
		const onChangeMenuVisibility = jest.fn();
		const { interactions } = renderToolbar({ props: { onChangeMenuVisibility } });

		await userEvent.click(screen.getByRole('button', { name: 'Add reaction' }));

		expect(onChangeMenuVisibility).toHaveBeenLastCalledWith(true);

		const { onClose } = interactions.openReactionPicker.mock.calls[0][2] as { onClose: () => void };
		onClose();

		expect(onChangeMenuVisibility).toHaveBeenLastCalledWith(false);
	});

	it('quotes and replies in a thread through the contexts (R10)', async () => {
		const { interactions, navigation } = renderToolbar();

		await userEvent.click(screen.getByRole('button', { name: 'Quote' }));
		await userEvent.click(screen.getByRole('button', { name: 'Reply in thread' }));

		expect(interactions.quote).toHaveBeenCalledWith(message);
		expect(navigation.replyInThread).toHaveBeenCalledWith(message);
	});

	it('jumps to the message (R10)', async () => {
		const { navigation } = renderToolbar({ props: { messageContext: 'pinned' } });

		await userEvent.click(screen.getByRole('button', { name: 'Jump to message' }));

		expect(navigation.jumpToMessage).toHaveBeenCalledWith(message);
	});

	it('hides the items the layout hides (R11)', () => {
		const layout = { hiddenActions: { messageToolbox: ['quote-message', 'reaction-message'], roomToolbox: [] } } as never;
		const providers = mockMessageProviders({
			root: createRoot().wrap((children: ReactNode) => <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>),
		});

		render(<MessageToolbar message={message} room={room} subscription={subscription} onChangeMenuVisibility={jest.fn()} />, {
			wrapper: providers.wrapper,
		});

		expect(toolbarButtonNames()).toEqual(['Reply in thread', 'Forward message']);
	});

	it('leaves out the conversation items without a subscription (R7)', () => {
		renderToolbar({ props: { subscription: undefined } });

		expect(toolbarButtonNames()).toEqual(['Forward message']);
	});

	it('renders the AI actions in their own menu (R16)', async () => {
		const summarize = menuAction({ id: 'summarize', label: 'Edit', type: 'apps' });
		const useAiActions = jest.fn(() => [summarize]);

		renderToolbar({ toolbar: { useAiActions } });

		await userEvent.click(screen.getByRole('button', { name: 'AI actions' }));
		await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

		expect(summarize.action).toHaveBeenCalled();
	});

	it('leaves out the AI menu when no AI action is offered (R16)', () => {
		renderToolbar();

		expect(screen.queryByRole('button', { name: 'AI actions' })).not.toBeInTheDocument();
	});

	it('runs the menu entry chosen (R18)', async () => {
		const edit = menuAction({ id: 'edit-message', label: 'Edit', order: 1, type: 'management' });
		const remove = menuAction({ id: 'delete-message', label: 'Delete', order: 2, type: 'management', variant: 'danger' });

		renderToolbar({ toolbar: { useMenuActions: () => [remove, edit] } });

		await userEvent.click(screen.getByRole('button', { name: 'More' }));
		await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

		expect(remove.action).toHaveBeenCalled();
		expect(edit.action).not.toHaveBeenCalled();
	});
});

describe('MessageToolbar stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations (R28)', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
