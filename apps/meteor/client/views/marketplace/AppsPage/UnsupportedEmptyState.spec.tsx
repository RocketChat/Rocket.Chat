import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import React from 'react';

import UnsupportedEmptyState from './UnsupportedEmptyState';

describe('with private apps enabled', () => {
	it('should inform that the marketplace is unavailable due unsupported version', () => {
		render(<UnsupportedEmptyState />, {
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Marketplace_unavailable: 'Marketplace unavailable',
				})
				.build(),
			legacyRoot: true,
		});

		expect(screen.getByRole('heading', { name: 'Marketplace unavailable' })).toBeInTheDocument();
	});
});
