import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './TimestampPicker.stories';
import { TimestampPickerModal } from './TimestampPickerModal';
import { dateToISOString, generateTimestampMarkup } from '../../../../../../../lib/utils/timestamp/conversion';
import { TIMESTAMP_FORMATS } from '../../../../../../../lib/utils/timestamp/formats';

jest.mock('../../../../../../GazzodownText', () => ({
	__esModule: true,
	default: () => <div data-testid='mock-gazzodown-text'>Mocked GazzodownText</div>,
}));

const wrapper = mockAppRoot().withUserPreference('useEmojis', true).withSetting('UI_Use_Real_Name', false).withJohnDoe();

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('Story Tests', () => {
	beforeAll(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
	});

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const view = render(<Story />, { wrapper: wrapper.build() });
		expect(view.baseElement).toMatchSnapshot();
	});

	test.each(testCases)(
		`%s should be accessible`,
		async (_storyname, Story) => {
			jest.useRealTimers();

			const { container } = render(<Story />, { wrapper: wrapper.build() });
			/**
			 ** Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
			 **/
			const results = await axe(container, {
				rules: { 'nested-interactive': { enabled: false } },
			});
			expect(results).toHaveNoViolations();

			jest.useFakeTimers();
			jest.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
		},
		30000,
	);

	afterAll(() => {
		jest.useRealTimers();
	});
});

describe('TimestampPicker', () => {
	const mockOnClose = jest.fn();
	const mockComposer = { insertText: jest.fn() };

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should complete timestamp creation workflow', async () => {
		render(<TimestampPickerModal onClose={mockOnClose} composer={mockComposer as any} />, {
			wrapper: wrapper.build(),
		});

		// 1. Select date
		const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
		await userEvent.type(dateInput, '{selectall}2025-07-25');

		// 2. Select time
		const timeInput = screen.getByDisplayValue(/\d{2}:\d{2}/);
		await userEvent.type(timeInput, '{selectall}14:30');

		// 3. Select format
		const formatSelectButton = screen.getByRole('button', {
			name: /timestamps\.fullDateTime/i,
		});
		await userEvent.click(formatSelectButton);

		const formatOption = screen.getByRole('option', {
			name: /timestamps\.fullDateTime \(timestamps\.fullDateTimeDescription\)/,
		});
		await userEvent.click(formatOption);

		// 4. Select timezone
		const timezoneSelects = screen.getAllByRole('button', { name: /Local_Time/ });
		const timezoneSelect = timezoneSelects[0];
		await userEvent.click(timezoneSelect);

		const timezoneOption = screen.getByRole('option', { name: /UTC\+8/ });
		await userEvent.click(timezoneOption);

		// 5. Submit
		const addButton = screen.getByRole('button', { name: /add/i });
		await userEvent.click(addButton);

		// Verify results
		expect(mockComposer.insertText).toHaveBeenCalledTimes(1);
		expect(mockOnClose).toHaveBeenCalledTimes(1);

		const output = mockComposer.insertText.mock.calls[0][0];
		expect(output).toMatch(/^<t::f>$/);
	});

	// Cancel Operation Test
	it('should call onClose when cancel is clicked', async () => {
		render(<TimestampPickerModal onClose={mockOnClose} />, { wrapper: wrapper.build() });

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await userEvent.click(cancelButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	// Format Validation Test
	it('should validate all timestamp formats', () => {
		const testDate = new Date('2025-07-25T10:30:00.000Z');
		const timestamp = dateToISOString(testDate, 'UTC+8');

		Object.keys(TIMESTAMP_FORMATS).forEach((format) => {
			const markup = generateTimestampMarkup(timestamp, format as any);
			expect(markup).toBe(`<t:${timestamp}:${format}>`);
		});
	});
});

describe('Timestamp Conversion Logic', () => {
	const testDate = new Date('2025-07-25T10:30:00.000Z');

	it('should convert date to correct ISO string for different timezones', () => {
		expect(dateToISOString(testDate, 'local')).toBe('2025-07-25T10:30:00.000+00:00');
		expect(dateToISOString(testDate, 'UTC+8')).toContain('+08:00');
		expect(dateToISOString(testDate, 'UTC-5')).toContain('-05:00');
	});

	it('should handle extreme timezone values', () => {
		const extremeTimezones = ['UTC-12', 'UTC+12'];

		extremeTimezones.forEach((timezone) => {
			const result = dateToISOString(testDate, timezone as any);
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);

			if (timezone === 'UTC+12') {
				expect(result).toContain('+12:00');
			} else {
				expect(result).toContain('-12:00');
			}
		});
	});
});
