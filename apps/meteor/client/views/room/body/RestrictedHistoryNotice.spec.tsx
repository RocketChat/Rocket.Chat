import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import RestrictedHistoryNotice from './RestrictedHistoryNotice';

const appRoot = () =>
	mockAppRoot().withTranslations('en', 'core', {
		Messages_before_date_not_available_to_you: "Messages sent before {{date}} aren't available to you",
	});

describe('RestrictedHistoryNotice', () => {
	const historyVisibleFrom = new Date(2026, 10, 16, 14, 30);

	it('names the time of the cutoff, not only its day', () => {
		render(<RestrictedHistoryNotice historyVisibleFrom={historyVisibleFrom} />, { wrapper: appRoot().build() });

		expect(screen.getByRole('status')).toHaveTextContent("Messages sent before November 16th, 2026 2:30 PM aren't available to you");
	});

	it('follows the 24-hour clock preference', () => {
		render(<RestrictedHistoryNotice historyVisibleFrom={historyVisibleFrom} />, {
			wrapper: appRoot().withUserPreference('clockMode', 2).build(),
		});

		expect(screen.getByRole('status')).toHaveTextContent('November 16, 2026 14:30');
	});
});
