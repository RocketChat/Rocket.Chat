import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import {
	MessageSelectionContext,
	createMessageSelectionStore,
	messageContentDefaultValue,
	messageDisplayDefaultValue,
	messageInteractionsDefaultValue,
	messageMediaDefaultValue,
	messageNavigationDefaultValue,
	messageRelatedDataDefaultValue,
	messageRenderersDefaultValue,
	messageToolbarDefaultValue,
	useIsMessageBeingEdited,
	useIsMessageSelected,
	useIsSelectingMessages,
	useMessageContent,
	useMessageDisplay,
	useMessageInteractions,
	useMessageMedia,
	useMessageNavigation,
	useMessageRelatedData,
	useMessageRenderers,
	useMessageToolbar,
	useToggleMessageSelection,
} from '.';

const message = { _id: 'mid', rid: 'rid', msg: 'hello', ts: new Date(), u: { _id: 'uid', username: 'user' }, _updatedAt: new Date() };

it('renders every context default without a provider (R1)', () => {
	const { result } = renderHook(() => ({
		display: useMessageDisplay(),
		navigation: useMessageNavigation(),
		interactions: useMessageInteractions(),
		toolbar: useMessageToolbar(),
		renderers: useMessageRenderers(),
		relatedData: useMessageRelatedData(),
		content: useMessageContent(),
		media: useMessageMedia(),
		editing: useIsMessageBeingEdited('mid'),
		selecting: useIsSelectingMessages(),
		selected: useIsMessageSelected('mid'),
	}));

	expect(result.current.display).toBe(messageDisplayDefaultValue);
	expect(result.current.navigation).toBe(messageNavigationDefaultValue);
	expect(result.current.interactions).toBe(messageInteractionsDefaultValue);
	expect(result.current.toolbar).toBe(messageToolbarDefaultValue);
	expect(result.current.renderers).toBe(messageRenderersDefaultValue);
	expect(result.current.relatedData).toBe(messageRelatedDataDefaultValue);
	expect(result.current.content).toBe(messageContentDefaultValue);
	expect(result.current.media).toBe(messageMediaDefaultValue);
	expect(result.current.editing).toBe(false);
	expect(result.current.selecting).toBe(false);
	expect(result.current.selected).toBe(false);
});

it('turns presentation off and allows interaction by default (R2)', () => {
	expect(messageDisplayDefaultValue).toMatchObject({
		showRoles: false,
		showRealName: false,
		showUsername: false,
		showColors: false,
		readReceipts: { enabled: false, storeUsers: false },
		embedsEnabled: false,
		allowsInteraction: true,
	});
	expect(messageDisplayDefaultValue.highlights).toBeUndefined();
	expect(messageDisplayDefaultValue.katex).toBeUndefined();
});

it('keeps app-acting capabilities inert by default (R3)', async () => {
	const { hasReacted, canDelete, toggleReaction, followThread } = messageInteractionsDefaultValue;
	const { getPermalink, openExternalLink, openRoom, replyInThread } = messageNavigationDefaultValue;
	const open = jest.spyOn(window, 'open').mockImplementation(() => null);

	expect(hasReacted(message, ':tada:')).toBe(false);
	expect(canDelete(message)).toBe(false);
	expect(toggleReaction(message, ':tada:')).toBeUndefined();
	expect(followThread(message)).toBeUndefined();
	expect(openRoom('rid')).toBeUndefined();
	expect(replyInThread(message)).toBeUndefined();
	await expect(getPermalink('mid')).resolves.toBe('#mid');

	openExternalLink('https://example.com');
	expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');

	open.mockRestore();
});

it('normalizes a plain message into one paragraph by default (R4)', () => {
	const normalized = messageContentDefaultValue.useNormalizedMessage(message);

	expect(normalized.md).toEqual([{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'hello' }] }]);
	expect(normalized.mdSource).toBe('hello');
});

it('draws the default renderers as light stand-ins (R4)', () => {
	const { Markup, PreviewMarkup, Emoji, UiKitMessageBlock } = messageRenderersDefaultValue;

	render(
		<>
			<Markup md={[]} msg='markdown source' />
			<PreviewMarkup message={message} />
			<Emoji emojiHandle=':smile:' />
			<UiKitMessageBlock rid='rid' mid='mid' blocks={[{ type: 'divider' }]} />
		</>,
	);

	expect(screen.getByText('markdown source')).toBeInTheDocument();
	expect(screen.getByText('hello')).toBeInTheDocument();
	expect(screen.getByText(':smile:')).toBeInTheDocument();
	expect(screen.getByText('UiKit: 1 block')).toBeInTheDocument();
});

it('formats file sizes in binary units by default (R5)', () => {
	expect(messageMediaDefaultValue.formatFileSize(1024)).toBe('1.00 KB');
	expect(messageMediaDefaultValue.formatFileSize(512)).toBe('512 B');
	expect(messageMediaDefaultValue.canDownloadEncrypted).toBe(true);
});

it('reads and toggles the selection store (R7)', () => {
	const store = createMessageSelectionStore();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<MessageSelectionContext.Provider value={store}>{children}</MessageSelectionContext.Provider>
	);

	const { result } = renderHook(
		() => ({ selecting: useIsSelectingMessages(), selected: useIsMessageSelected('mid'), toggle: useToggleMessageSelection('mid') }),
		{ wrapper },
	);

	expect(result.current).toMatchObject({ selecting: false, selected: false });

	act(() => {
		store.setSelecting(true);
		result.current.toggle();
	});

	expect(result.current).toMatchObject({ selecting: true, selected: true });
	expect(store.getSelected()).toEqual(['mid']);
});

it('offers no menu entry and no quick reaction, and counts none, by default (R1)', () => {
	const { useMenuActions, useAiActions, useQuickReactions, useCountQuickReaction } = messageToolbarDefaultValue;

	expect(useMenuActions(message, {} as never)).toEqual([]);
	expect(useAiActions(message, {} as never)).toEqual([]);
	expect(useQuickReactions()).toEqual([]);
	expect(useCountQuickReaction()('smile')).toBeUndefined();
});

it('has no roles resolved by the place by default, so a header resolves them itself (message-variants R49)', () => {
	expect(messageRelatedDataDefaultValue.usePlaceUserRoles('uid', 'rid')).toBeUndefined();
	expect(messageRelatedDataDefaultValue.useUserRoles('uid', 'rid', { enabled: true })).toEqual({ workspaceRoles: [], roomRoles: [] });
});
