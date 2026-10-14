import { after, before, beforeEach, describe, it, mock, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';
import sinon from 'sinon';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
let clock: sinon.SinonFakeTimers;

const wrapper = mockAppRoot().withUserPreference('useEmojis', true).withSetting('UI_Use_Real_Name', false).withJohnDoe();

mock.module('../../../../../../GazzodownText', {
	exports: {
		default: {
			__esModule: true,
			default: () => <div data-testid='mock-gazzodown-text'>Mocked GazzodownText</div>,
		},
	},
});
const stories: typeof import('./TimestampPicker.stories') = require('./TimestampPicker.stories');
const { TimestampPickerModal }: typeof import('./TimestampPickerModal') = require('./TimestampPickerModal');
const {
	dateToISOString,
	generateTimestampMarkup,
}: typeof import('../../../../../../../lib/utils/timestamp/conversion') = require('../../../../../../../lib/utils/timestamp/conversion');
const {
	TIMESTAMP_FORMATS,
}: typeof import('../../../../../../../lib/utils/timestamp/formats') = require('../../../../../../../lib/utils/timestamp/formats');

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('Story Tests', () => {
	before(() => {
		clock = sinon.useFakeTimers({
			toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
			shouldAdvanceTime: true,
		});
		clock.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`renders ${_storyname} without crashing`, async (t) => {
			const view = render(<Story />, { wrapper: wrapper.build() });
			t.assert.snapshot(view.baseElement);
		});
	});

	testCases.forEach(([_storyname, Story]) => {
		test(
			`${_storyname} should be accessible`,
			{
				timeout: 30000,
			},
			async () => {
				clock?.restore();

				const { container } = render(<Story />, { wrapper: wrapper.build() });
				/**
				 ** Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
				 **/
				const results = await axe(container, {
					rules: { 'nested-interactive': { enabled: false } },
				});
				expect(results).toHaveNoViolations();

				clock = sinon.useFakeTimers({
					toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
					shouldAdvanceTime: true,
				});
				clock.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
			},
		);
	});

	after(() => {
		clock?.restore();
	});
});

describe('TimestampPicker', () => {
	const mockOnClose = fn<FunctionLike>();
	const mockComposer = { insertText: fn<FunctionLike>() };

	beforeEach(() => {
		mocker.clearAllMocks();
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
