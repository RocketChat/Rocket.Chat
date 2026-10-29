import { createFakeMessage, createFakeRoom, createFakeSubscription, mockAppRoot } from '@rocket.chat/mock-providers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { composeStories } from '@storybook/react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import type { MessageToolbarProps } from './MessageToolbar';
import MessageToolbar from './MessageToolbar';
import * as stories from './MessageToolbar.stories';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';
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

const room = createFakeRoom({ _id: 'room', t: 'c' });
const subscription = createFakeSubscription({ rid: room._id });
const message = createFakeMessage({ _id: 'message', rid: room._id });

const renderToolbar = ({
	toolbar,
	props,
}: {
	toolbar?: Partial<MessageToolbarContextValue>;
	props?: Partial<MessageToolbarProps>;
} = {}) => {
	const providers = mockMessageProviders({ root: createRoot(), toolbar });

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

describe('MessageToolbar', () => {
	it('should render the precomputed menu actions and run the one clicked', async () => {
		const edit = menuAction({ id: 'edit-message', label: 'Edit', order: 1, type: 'management' });
		const remove = menuAction({ id: 'delete-message', label: 'Delete', order: 2, type: 'management', variant: 'danger' });
		const useMenuActions = jest.fn(() => [remove, edit]);

		renderToolbar({ toolbar: { useMenuActions } });

		expect(useMenuActions).toHaveBeenCalledWith(message, { room, subscription, context: 'message' });

		await userEvent.click(screen.getByRole('button', { name: 'More' }));

		const [first, second] = screen.getAllByRole('menuitem');
		expect(first).toHaveTextContent('Edit');
		expect(second).toHaveTextContent('Delete');

		await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

		expect(remove.action).toHaveBeenCalled();
		expect(edit.action).not.toHaveBeenCalled();
	});

	it('should render the AI actions in their own menu', async () => {
		const summarize = menuAction({ id: 'summarize', label: 'Edit', type: 'apps' });
		const useAiActions = jest.fn(() => [summarize]);

		renderToolbar({ toolbar: { useAiActions } });

		await userEvent.click(screen.getByRole('button', { name: 'AI actions' }));
		await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));

		expect(summarize.action).toHaveBeenCalled();
	});

	it('should leave out the menus when there are no actions', () => {
		renderToolbar();

		expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'AI actions' })).not.toBeInTheDocument();
	});

	it.each<[MessageActionContext, string[]]>([
		['message', ['Add reaction', 'Quote', 'Reply in thread', 'Forward message']],
		['message-mobile', ['Add reaction', 'Quote', 'Reply in thread', 'Forward message', 'Jump to message']],
		['threads', ['Add reaction', 'Quote', 'Forward message', 'Jump to message']],
		['videoconf', ['Add reaction', 'Reply in thread']],
		['videoconf-threads', ['Add reaction', 'Jump to message']],
		['federated', ['Add reaction', 'Quote', 'Reply in thread']],
		['pinned', ['Jump to message']],
		['direct', ['Jump to message']],
		['starred', ['Jump to message']],
		['mentions', ['Jump to message']],
		['search', ['Jump to message']],
	])('should show the inline items of the %s context', (messageContext, expected) => {
		renderToolbar({ props: { messageContext } });

		expect(toolbarButtonNames()).toEqual(expected);
	});

	it('should infer the thread context from the message', () => {
		const useMenuActions = jest.fn(() => []);
		const threadMessage = createFakeMessage({ _id: 'reply', rid: room._id, tmid: 'parent' });

		renderToolbar({ toolbar: { useMenuActions }, props: { message: threadMessage } });

		expect(useMenuActions).toHaveBeenCalledWith(threadMessage, { room, subscription, context: 'threads' });
	});

	it('should toggle a quick reaction', async () => {
		const { interactions } = renderToolbar({ toolbar: { useQuickReactions: () => ['+1', 'smile', 'tada', 'rocket'] } });

		expect(screen.queryByRole('button', { name: 'rocket' })).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'smile' }));

		expect(interactions.toggleReaction).toHaveBeenCalledWith(message, ':smile:');
	});

	it('should open the reaction picker', async () => {
		const { interactions } = renderToolbar();

		await userEvent.click(screen.getByRole('button', { name: 'Add reaction' }));

		expect(interactions.openReactionPicker).toHaveBeenCalledWith(expect.anything(), message, { onClose: expect.any(Function) });
	});

	it('should hide reactions where the viewer cannot react', () => {
		renderToolbar({ props: { room: { ...room, ro: true } } });

		expect(screen.queryByRole('button', { name: 'Add reaction' })).not.toBeInTheDocument();
	});

	it('should quote the message', async () => {
		const { interactions } = renderToolbar();

		await userEvent.click(screen.getByRole('button', { name: 'Quote' }));

		expect(interactions.quote).toHaveBeenCalledWith(message);
	});

	it('should open the thread of the message', async () => {
		const { navigation } = renderToolbar();

		await userEvent.click(screen.getByRole('button', { name: 'Reply in thread' }));

		expect(navigation.openThread).toHaveBeenCalledWith({ rid: room._id, tmid: message._id });
	});

	it('should jump to the message', async () => {
		const { navigation } = renderToolbar({ props: { messageContext: 'pinned' } });

		await userEvent.click(screen.getByRole('button', { name: 'Jump to message' }));

		expect(navigation.jumpToMessage).toHaveBeenCalledWith(message);
	});

	it('should leave out the conversation actions without a subscription', () => {
		renderToolbar({ props: { subscription: undefined } });

		expect(toolbarButtonNames()).toEqual(['Forward message']);
	});
});

describe('MessageToolbar stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
