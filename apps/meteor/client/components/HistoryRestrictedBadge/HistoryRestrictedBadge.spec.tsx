import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import HistoryRestrictedBadge from './HistoryRestrictedBadge';

describe('HistoryRestrictedBadge', () => {
	it('names the time of the cutoff, not only its day', () => {
		render(<HistoryRestrictedBadge historyVisibleFrom={new Date(2026, 10, 16, 14, 30)} />, {
			wrapper: mockAppRoot().withTranslations('en', 'core', { Messages_hidden_before_date: 'Messages before {{date}} hidden' }).build(),
		});

		expect(screen.getByRole('status')).toHaveAttribute('title', 'Messages before November 16th, 2026 2:30 PM hidden');
	});
});
