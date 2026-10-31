import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ScheduleMessageModal from './ScheduleMessageModal';

const appRoot = () =>
	mockAppRoot()
		.withTranslations('en', 'core', {
			'Schedule': 'Schedule',
			'Date': 'Date',
			'Time': 'Time',
			'Schedule_sends_at': 'Sends {{date}} · {{timeZone}}',
			'error-scheduled-message-time-out-of-range': 'Pick a time between 1 minute and 120 days from now',
		})
		.build();

const dateField = () => screen.getByLabelText('Date');
const timeField = () => screen.getByLabelText('Time');
const scheduleButton = () => screen.getByRole('button', { name: 'Schedule' });

describe('ScheduleMessageModal', () => {
	beforeEach(() => {
		jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date(2026, 9, 21, 15, 30));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('starts at tomorrow 9:00 with date and time on one row and a summary with the time zone', () => {
		render(<ScheduleMessageModal onConfirm={jest.fn()} onClose={jest.fn()} />, { wrapper: appRoot() });

		expect(dateField()).toHaveValue('2026-10-22');
		expect(timeField()).toHaveValue('09:00');
		expect(dateField()).toHaveAttribute('min', '2026-10-21');
		expect(screen.getByText(/^Sends .+ · .+$/)).toBeInTheDocument();
	});

	it('starts at the time it is given, for a reschedule', () => {
		render(<ScheduleMessageModal initialDate={new Date(2026, 9, 25, 14, 15)} onConfirm={jest.fn()} onClose={jest.fn()} />, {
			wrapper: appRoot(),
		});

		expect(dateField()).toHaveValue('2026-10-25');
		expect(timeField()).toHaveValue('14:15');
	});

	it('refuses a time in the past', () => {
		render(<ScheduleMessageModal onConfirm={jest.fn()} onClose={jest.fn()} />, { wrapper: appRoot() });

		fireEvent.change(dateField(), { target: { value: '2026-10-21' } });
		fireEvent.change(timeField(), { target: { value: '08:00' } });

		expect(screen.getByText('Pick a time between 1 minute and 120 days from now')).toBeInTheDocument();
		expect(scheduleButton()).toBeDisabled();
	});

	it('recovers after the time field was cleared', () => {
		render(<ScheduleMessageModal onConfirm={jest.fn()} onClose={jest.fn()} />, { wrapper: appRoot() });

		fireEvent.change(timeField(), { target: { value: '' } });
		expect(scheduleButton()).toBeDisabled();

		fireEvent.change(timeField(), { target: { value: '10:30' } });
		expect(scheduleButton()).toBeEnabled();
	});

	it('confirms the local date and time that the user picked', async () => {
		const onConfirm = jest.fn().mockResolvedValue(undefined);
		render(<ScheduleMessageModal onConfirm={onConfirm} onClose={jest.fn()} />, { wrapper: appRoot() });

		fireEvent.change(timeField(), { target: { value: '10:30' } });
		await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).click(scheduleButton());

		expect(onConfirm).toHaveBeenCalledWith(new Date(2026, 9, 22, 10, 30));
	});

	it('marks the Schedule button with the send icon', () => {
		render(<ScheduleMessageModal onConfirm={jest.fn()} onClose={jest.fn()} />, { wrapper: appRoot() });

		expect(scheduleButton().innerHTML).toContain('rcx-icon--name-send');
	});
});
