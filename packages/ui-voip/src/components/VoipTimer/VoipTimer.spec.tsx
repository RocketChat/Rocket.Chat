import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';

import VoipTimer from './VoipTimer';

const appRoot = mockAppRoot();

describe('VoipTimer', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.clearAllTimers();
	});

	it('should display the initial time correctly', () => {
		render(<VoipTimer />, { wrapper: appRoot.build(), legacyRoot: true });

		expect(screen.getByText('00:00')).toBeInTheDocument();
	});

	it('should update the time after a few seconds', () => {
		render(<VoipTimer />, { wrapper: appRoot.build(), legacyRoot: true });

		act(() => {
			jest.advanceTimersByTime(5000);
		});

		expect(screen.getByText('00:05')).toBeInTheDocument();
	});

	it('should start with a minute on the timer', () => {
		const startTime = new Date();
		startTime.setMinutes(startTime.getMinutes() - 1);
		render(<VoipTimer startAt={startTime} />, { wrapper: appRoot.build(), legacyRoot: true });

		expect(screen.getByText('01:00')).toBeInTheDocument();
	});
});
