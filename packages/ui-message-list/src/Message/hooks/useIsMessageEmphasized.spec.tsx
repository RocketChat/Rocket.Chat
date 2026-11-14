import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useIsMessageEmphasized } from './useIsMessageEmphasized';
import { MessageEditingContext } from '../contexts/MessageEditingContext';

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
