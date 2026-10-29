import { mockAppRoot } from '@rocket.chat/mock-providers';
import { AttachmentContext } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { useCollapse } from './useCollapse';
import type { MessageRelatedDataContextValue } from '../contexts/MessageRelatedDataContext';
import { MessageRelatedDataContext, messageRelatedDataDefaultValue } from '../contexts/MessageRelatedDataContext';

const createCollapsedStore = () => {
	const toggled = new Set<string>();

	const useCollapsedState: MessageRelatedDataContextValue['useCollapsedState'] = (key, initiallyCollapsed) => {
		const [, rerender] = useState(0);
		const toggle = () => {
			if (!toggled.delete(key)) {
				toggled.add(key);
			}
			rerender((count) => count + 1);
		};
		return [toggled.has(key) !== initiallyCollapsed, toggle];
	};

	return jest.fn(useCollapsedState);
};

const wrapperWith = (useCollapsedState: MessageRelatedDataContextValue['useCollapsedState']) => {
	const AppRoot = mockAppRoot().build();
	return ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<MessageRelatedDataContext.Provider value={{ ...messageRelatedDataDefaultValue, useCollapsedState }}>
				{children}
			</MessageRelatedDataContext.Provider>
		</AppRoot>
	);
};

it('should toggle with the default local state when keyed but no provider remembers it', () => {
	const { result } = renderHook(() => useCollapse(true, 'mid-0'), { wrapper: mockAppRoot().build() });
	expect(result.current[0]).toBe(true);

	act(() => result.current[1]());
	expect(result.current[0]).toBe(false);

	act(() => result.current[1]());
	expect(result.current[0]).toBe(true);
});

it('should persist the toggle through the provider when keyed', () => {
	const useCollapsedState = createCollapsedStore();
	const wrapper = wrapperWith(useCollapsedState);

	const { result, unmount } = renderHook(() => useCollapse(false, 'mid-a'), { wrapper });
	expect(result.current[0]).toBe(false);
	expect(useCollapsedState).toHaveBeenCalledWith('mid-a', false);

	act(() => result.current[1]());
	expect(result.current[0]).toBe(true);
	unmount();

	const { result: remounted } = renderHook(() => useCollapse(false, 'mid-a'), { wrapper });
	expect(remounted.current[0]).toBe(true);
});

it('should toggle with local state when there is no key', () => {
	const useCollapsedState = createCollapsedStore();
	const wrapper = wrapperWith(useCollapsedState);

	const { result, unmount } = renderHook(() => useCollapse(false), { wrapper });

	act(() => result.current[1]());
	expect(result.current[0]).toBe(true);
	unmount();

	const { result: remounted } = renderHook(() => useCollapse(false), { wrapper });
	expect(remounted.current[0]).toBe(false);
});

it('should start collapsed when the user collapses attachments by default', () => {
	const { result } = renderHook(() => useCollapse(false), {
		wrapper: ({ children }) => (
			<AttachmentContext.Provider
				value={{ getURL: (url) => url, dimensions: { width: 368, height: 368 }, collapsedByDefault: true, autoLoadEmbedMedias: true }}
			>
				{children}
			</AttachmentContext.Provider>
		),
	});

	expect(result.current[0]).toBe(true);
});
