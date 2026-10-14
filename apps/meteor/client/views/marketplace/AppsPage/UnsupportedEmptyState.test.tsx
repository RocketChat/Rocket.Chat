import { describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';

import UnsupportedEmptyState from './UnsupportedEmptyState';

describe('with private apps enabled', () => {
	const appRoot = mockAppRoot().withTranslations('en', 'core', {
		Marketplace_unavailable: 'Marketplace unavailable',
	});

	it('should inform that the marketplace is unavailable due unsupported version', () => {
		render(<UnsupportedEmptyState />, { wrapper: appRoot.build() });

		expect(screen.getByRole('heading', { name: 'Marketplace unavailable' })).toBeInTheDocument();
	});
});
