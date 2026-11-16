import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useIsMessageEmphasized } from './useIsMessageEmphasized';
import { MessageEditingContext } from '../contexts/MessageEditingContext';
import { MessageRowStateContext } from '../contexts/MessageRowStateContext';

const renderEmphasized = (editingMessageId?: string) =>
	renderHook(() => useIsMessageEmphasized('messageId'), {
		wrapper: ({ children }: { children: ReactNode }) => (
			<MessageEditingContext.Provider value={editingMessageId}>{children}</MessageEditingContext.Provider>
		),
	}).result.current;

it('is true only for the message the editing context names (R18)', () => {
	expect(renderEmphasized('messageId')).toBe(true);
	expect(renderEmphasized('another')).toBe(false);
	expect(renderEmphasized()).toBe(false);
});

it('draws the message being edited and the one a jump highlights, each until its own reason ends (message-list R50)', () => {
	const result = (messageId: string) =>
		renderHook(() => useIsMessageEmphasized(messageId), {
			wrapper: ({ children }: { children: ReactNode }) => (
				<MessageEditingContext.Provider value='edited'>
					<MessageRowStateContext.Provider value={{ isHighlighted: (id) => id === 'jumped' }}>{children}</MessageRowStateContext.Provider>
				</MessageEditingContext.Provider>
			),
		}).result.current;

	expect(result('edited')).toBe(true);
	expect(result('jumped')).toBe(true);
	expect(result('other')).toBe(false);
});
