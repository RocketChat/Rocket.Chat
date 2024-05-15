import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { default as TimespanSettingInput, timeUnitToMs, msToTimeUnit, getHighestTimeUnit, TIMEUNIT } from './TimespanSettingInput';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

describe('timeUnitToMs function', () => {
	it('should correctly convert days to milliseconds', () => {
		expect(timeUnitToMs(TIMEUNIT.days, 1)).toBe(86400000);
		expect(timeUnitToMs(TIMEUNIT.days, 2)).toBe(172800000);
		expect(timeUnitToMs(TIMEUNIT.days, 0.5)).toBe(43200000);
	});

	it('should correctly convert hours to milliseconds', () => {
		expect(timeUnitToMs(TIMEUNIT.hours, 1)).toBe(3600000);
		expect(timeUnitToMs(TIMEUNIT.hours, 2)).toBe(7200000);
		expect(timeUnitToMs(TIMEUNIT.hours, 0.5)).toBe(1800000);
	});

	it('should correctly convert minutes to milliseconds', () => {
		expect(timeUnitToMs(TIMEUNIT.minutes, 1)).toBe(60000);
		expect(timeUnitToMs(TIMEUNIT.minutes, 2)).toBe(120000);
		expect(timeUnitToMs(TIMEUNIT.minutes, 0.5)).toBe(30000);
	});

	it('should throw an error for invalid time units', () => {
		expect(() => timeUnitToMs('invalidUnit' as TIMEUNIT, 1)).toThrow('TimespanSettingInput - timeUnitToMs - invalid time unit');
	});
});

describe('msToTimeUnit function', () => {
	it('should correctly convert milliseconds to days', () => {
		expect(msToTimeUnit(TIMEUNIT.days, 86400000)).toBe(1); // 1 day
		expect(msToTimeUnit(TIMEUNIT.days, 172800000)).toBe(2); // 2 days
		expect(msToTimeUnit(TIMEUNIT.days, 43200000)).toBe(0.5); // .5 days
	});

	it('should correctly convert milliseconds to hours', () => {
		expect(msToTimeUnit(TIMEUNIT.hours, 3600000)).toBe(1); // 1 hour
		expect(msToTimeUnit(TIMEUNIT.hours, 7200000)).toBe(2); // 2 hours
		expect(msToTimeUnit(TIMEUNIT.hours, 1800000)).toBe(0.5); // .5 hours
	});

	it('should correctly convert milliseconds to minutes', () => {
		expect(msToTimeUnit(TIMEUNIT.minutes, 60000)).toBe(1); // 1 min
		expect(msToTimeUnit(TIMEUNIT.minutes, 120000)).toBe(2); // 2 min
		expect(msToTimeUnit(TIMEUNIT.minutes, 30000)).toBe(0.5); // .5 min
	});

	it('should throw an error for invalid time units', () => {
		expect(() => msToTimeUnit('invalidUnit' as TIMEUNIT, 1)).toThrow('TimespanSettingInput - msToTimeUnit - invalid time unit');
	});
});

describe('getHighestTimeUnit function', () => {
	it('should return minutes if milliseconds cannot be evenly divided into hours or days', () => {
		expect(getHighestTimeUnit(900000)).toBe(TIMEUNIT.minutes); // 15 min
		expect(getHighestTimeUnit(2100000)).toBe(TIMEUNIT.minutes); // 35 min
		expect(getHighestTimeUnit(3660000)).toBe(TIMEUNIT.minutes); // 61 minutes
		expect(getHighestTimeUnit(86460000)).toBe(TIMEUNIT.minutes); // 1441 minutes
	});

	it('should return hours if milliseconds can be evenly divided into hours but not days', () => {
		expect(getHighestTimeUnit(3600000)).toBe(TIMEUNIT.hours); // 1 hour
		expect(getHighestTimeUnit(7200000)).toBe(TIMEUNIT.hours); // 2 hours
		expect(getHighestTimeUnit(90000000)).toBe(TIMEUNIT.hours); // 25 hours
	});

	it('should return days if milliseconds can be evenly divided into days', () => {
		expect(getHighestTimeUnit(86400000)).toBe(TIMEUNIT.days); // 1 day
		expect(getHighestTimeUnit(172800000)).toBe(TIMEUNIT.days); // 2 days
		expect(getHighestTimeUnit(604800000)).toBe(TIMEUNIT.days); // 7 days
	});
});

describe('TimespanSettingInput component', () => {
	const onChangeValueMock = jest.fn();
	const onResetButtonClickMock = jest.fn();

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call onChangeValue with the correct value when inputting a value and changing time unit', () => {
		render(
			<TimespanSettingInput
				disabled={false}
				hasResetButton={false}
				_id='timespanInput'
				label='Timespan'
				value='86400000' // 1 day
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
			/>,
		);

		const numberInput = screen.getByRole('spinbutton');
		userEvent.clear(numberInput); // Change value to 2
		userEvent.type(numberInput, '2');

		expect(onChangeValueMock).toHaveBeenCalledWith(2 * 24 * 60 * 60 * 1000); // 2 days in milliseconds
	});

	it('should correctly convert value to minutes when changing time unit to minutes', () => {
		render(
			<TimespanSettingInput
				disabled={false}
				hasResetButton={false}
				_id='timespanInput'
				label='Timespan'
				value='3600000' // 1 hour in milliseconds
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
			/>,
		);

		const selectInput = screen.getByRole('button', { name: 'hours' });
		userEvent.click(selectInput);
		const minutesOption = screen.getByRole('option', { name: 'minutes' });
		userEvent.click(minutesOption);

		expect(screen.getByDisplayValue('60')).toBeTruthy();
	});

	it('should correctly convert value to hours when changing time unit to hours', () => {
		render(
			<TimespanSettingInput
				disabled={false}
				hasResetButton={false}
				_id='timespanInput'
				label='Timespan'
				value='86400000' // 1 day in milliseconds
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
			/>,
		);

		const selectInput = screen.getByRole('button', { name: 'days' });
		userEvent.click(selectInput);
		const hoursOption = screen.getByRole('option', { name: 'hours' });
		userEvent.click(hoursOption);

		expect(screen.getByDisplayValue('24')).toBeTruthy();
	});

	it('should correctly convert value to days when changing time unit to days', () => {
		render(
			<TimespanSettingInput
				disabled={false}
				hasResetButton={false}
				_id='timespanInput'
				label='Timespan'
				value='43200000' // half a day
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
			/>,
		);

		const selectInput = screen.getByRole('button', { name: 'hours' });
		userEvent.click(selectInput);
		const daysOption = screen.getByRole('option', { name: 'days' });
		userEvent.click(daysOption);

		expect(screen.getByDisplayValue('0.5')).toBeTruthy();
	});

	it('should call onResetButtonClick when reset button is clicked', () => {
		render(
			<TimespanSettingInput
				disabled={false}
				_id='timespanInput'
				label='Timespan'
				value='3600000' // 1 hour in milliseconds
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
				hasResetButton
				onResetButtonClick={onResetButtonClickMock}
			/>,
		);

		const resetButton = screen.getByTitle('Reset');
		userEvent.click(resetButton);

		expect(onResetButtonClickMock).toHaveBeenCalled();
	});
});
