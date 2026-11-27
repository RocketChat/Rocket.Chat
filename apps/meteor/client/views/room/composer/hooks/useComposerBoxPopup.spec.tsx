import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useComposerBoxPopup } from './useComposerBoxPopup';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';
import { ChatContext } from '../../contexts/ChatContext';

jest.mock('./useEnablePopupPreview', () => ({ useEnablePopupPreview: () => false }));

const option = { trigger: '#', triggerAnywhere: true, getValue: (item: { _id: string }) => item._id, getItemsFromLocal: async () => [] };

// Mimics the rich text composer: substring drops the trailing newline that selection.start still counts.
const createChat = (text: string) => {
	const replaceText = jest.fn();
	const composer = {
		substring: (start: number, end?: number) => text.replace(/\n$/, '').substring(start, end),
		selection: { start: text.length, end: text.length },
		replaceText,
	};
	return { chat: { composer } as unknown as ChatAPI, replaceText };
};

describe('useComposerBoxPopup select', () => {
	it('should end the replaced range at the composer caret, not at the length of the text before it', () => {
		const { chat, replaceText } = createChat('#gen\n');
		const wrapper = ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={new QueryClient()}>
				<ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
			</QueryClientProvider>
		);
		const { result } = renderHook(() => useComposerBoxPopup([option]), { wrapper });

		const node = document.createElement('div');
		act(() => {
			result.current.callbackRef(node);
		});
		act(() => {
			node.dispatchEvent(new Event('input'));
		});
		expect(result.current.option).toBe(option);

		act(() => {
			result.current.select?.({ _id: 'general' });
		});

		expect(replaceText).toHaveBeenCalledWith('#general', { start: 0, end: 5 });
	});
});
