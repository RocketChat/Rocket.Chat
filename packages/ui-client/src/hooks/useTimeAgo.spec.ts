import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useShortTimeAgo } from './useTimeAgo';

const renderShortTimeAgo = (language: string) =>
	renderHook(() => useShortTimeAgo(), {
		wrapper: mockAppRoot().withSetting('Message_TimeFormat', 'LT').withUserPreference('clockMode', 2).withDefaultLanguage(language).build(),
	}).result.current;

beforeEach(() => {
	jest.useFakeTimers({ now: new Date(2026, 10, 21, 12, 0) });
});

afterEach(() => {
	jest.useRealTimers();
});

describe('useShortTimeAgo', () => {
	it('writes older dates of this year in the order of the language', () => {
		expect(renderShortTimeAgo('de')(new Date(2026, 9, 20, 9, 0))).toBe('20. Okt.');
	});

	it('writes older dates of this year month first in English', () => {
		expect(renderShortTimeAgo('en')(new Date(2026, 9, 20, 9, 0))).toBe('Oct 20');
	});

	it('shows only the time for today', () => {
		expect(renderShortTimeAgo('de')(new Date(2026, 10, 21, 9, 5))).toBe('9:05');
	});
});
