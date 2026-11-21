import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import { de } from 'date-fns/locale/de';
import { enUS } from 'date-fns/locale/en-US';
import { setDefaultOptions } from 'date-fns/setDefaultOptions';

import { useFormatDateAndTime } from './useFormatDateAndTime';

const date = new Date(2026, 9, 31, 14, 5, 9);

const renderFormatter = (clockMode?: 1 | 2, withSeconds?: boolean) => {
	const root = mockAppRoot().withSetting('Message_TimeAndDateFormat', 'LLL');

	const { result } = renderHook(() => useFormatDateAndTime({ withSeconds }), {
		wrapper: (clockMode ? root.withUserPreference('clockMode', clockMode) : root).build(),
	});

	return result.current;
};

afterEach(() => {
	setDefaultOptions({ locale: enUS });
});

describe('with a 24-hour clock', () => {
	it('keeps the date in the order of the language', () => {
		setDefaultOptions({ locale: de });

		expect(renderFormatter(2)(date)).toBe('31. Oktober 2026 14:05');
		expect(renderFormatter(2, true)(date)).toBe('31. Oktober 2026 14:05:09');
	});

	it('shows English dates month first', () => {
		expect(renderFormatter(2)(date)).toBe('October 31st, 2026 14:05');
	});
});

describe('with a 12-hour clock', () => {
	it('keeps the date in the order of the language', () => {
		setDefaultOptions({ locale: de });

		expect(renderFormatter(1)(date)).toMatch(/^31\. Oktober 2026 2:05/);
	});

	it('shows English dates month first', () => {
		expect(renderFormatter(1)(date)).toBe('October 31st, 2026 2:05 PM');
		expect(renderFormatter(1, true)(date)).toBe('October 31st, 2026 2:05:09 PM');
	});
});

it('uses the workspace date and time format when no clock is chosen', () => {
	setDefaultOptions({ locale: de });

	expect(renderFormatter()(date)).toBe(renderFormatter(2)(date));
});
