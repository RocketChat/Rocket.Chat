import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useFormatDate } from './useFormatDate';
import { formatDate } from '../lib/dateFormat';

const date = new Date(2024, 0, 15, 10, 30);

it('formats a date with the Message_DateFormat setting (message-list R79)', () => {
	const { result } = renderHook(() => useFormatDate(), {
		wrapper: mockAppRoot().withSetting('Message_DateFormat', 'YYYY/MM/DD').build(),
	});

	expect(result.current(date)).toBe('2024/01/15');
});

it('formats with the LL format when the setting is not set (message-list R79)', () => {
	const { result } = renderHook(() => useFormatDate(), { wrapper: mockAppRoot().build() });

	expect(result.current(date)).toBe(formatDate(date, 'LL'));
});

it('keeps its identity while the setting does not change (message-list R79)', () => {
	const { result, rerender } = renderHook(() => useFormatDate(), {
		wrapper: mockAppRoot().withSetting('Message_DateFormat', 'LL').build(),
	});
	const first = result.current;

	rerender();

	expect(result.current).toBe(first);
});
