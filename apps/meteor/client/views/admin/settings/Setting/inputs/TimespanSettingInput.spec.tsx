import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { default as TimespanSettingInput, getHighestTimeUnit } from './TimespanSettingInput';
import { TIMEUNIT } from '../../../../../lib/convertTimeUnit';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

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

	it('should call onChangeValue with the correct value when inputting a value and changing time unit', async () => {
		render(
			<TimespanSettingInput
				disabled={false}
				packageValue='2592000000'
				hasResetButton={false}
				_id='timespanInput'
				label='Timespan'
				value='86400000' // 1 day
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		const numberInput = screen.getByRole('spinbutton');
		await userEvent.clear(numberInput); // Change value to 2
		await userEvent.type(numberInput, '2');

		expect(onChangeValueMock).toHaveBeenCalledWith(2 * 24 * 60 * 60 * 1000); // 2 days in milliseconds
	});

	it('should update value to minutes when changing time unit to minutes', async () => {
		render(
			<TimespanSettingInput
				disabled={false}
				packageValue='2592000000'
				hasResetButton={false}
				_id='timespanInput'
				label='Timespan'
				value='3600000' // 1 hour in milliseconds
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		const selectInput = screen.getByRole('button', { name: 'hours' });
		await userEvent.click(selectInput);
		const minutesOption = screen.getByRole('option', { name: 'minutes' });
		await userEvent.click(minutesOption);

		expect(onChangeValueMock).toHaveBeenCalledWith(60000); // 1 min in milliseconds

		expect(screen.getByDisplayValue('1')).toBeTruthy();
	});

	it('should update value to hours when changing time unit to hours', async () => {
		render(
			<TimespanSettingInput
				disabled={false}
				hasResetButton={false}
				packageValue='2592000000'
				_id='timespanInput'
				label='Timespan'
				value='86400000' // 1 day in milliseconds
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		const selectInput = screen.getByRole('button', { name: 'days' });
		await userEvent.click(selectInput);
		const hoursOption = screen.getByRole('option', { name: 'hours' });
		await userEvent.click(hoursOption);

		expect(onChangeValueMock).toHaveBeenCalledWith(3600000); // 1 hour in milliseconds

		expect(screen.getByDisplayValue('1')).toBeTruthy();
	});

	it('should update value to days when changing time unit to days', async () => {
		render(
			<TimespanSettingInput
				disabled={false}
				hasResetButton={false}
				packageValue='2592000000'
				_id='timespanInput'
				label='Timespan'
				value='43200000' // half a day
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		const selectInput = screen.getByRole('button', { name: 'hours' });
		await userEvent.click(selectInput);
		const daysOption = screen.getByRole('option', { name: 'days' });
		await userEvent.click(daysOption);

		expect(onChangeValueMock).toHaveBeenCalledWith(1036800000); // 12 days in milliseconds

		expect(screen.getByDisplayValue('12')).toBeTruthy();
	});

	it('should call onResetButtonClick when reset button is clicked', async () => {
		render(
			<TimespanSettingInput
				disabled={false}
				_id='timespanInput'
				packageValue='2592000000'
				label='Timespan'
				value='3600000' // 1 hour in milliseconds
				placeholder='Enter timespan'
				onChangeValue={onChangeValueMock}
				hasResetButton
				onResetButtonClick={onResetButtonClickMock}
			/>,
			{ wrapper: mockAppRoot().build() },
		);

		const resetButton = screen.getByTitle('Reset');
		await userEvent.click(resetButton);

		expect(onResetButtonClickMock).toHaveBeenCalled();
		expect(screen.getByDisplayValue('30')).toBeTruthy();
	});
});
