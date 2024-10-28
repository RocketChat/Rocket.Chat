import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';

import CustomEmoji from './CustomEmoji';

const appRoot = mockAppRoot().withEndpoint('GET', '/v1/emoji-custom.all', () => ({
	count: 1,
	offset: 0,
	total: 1,
	success: true,
	emojis: [
		{
			_id: '1',
			name: 'smile',
			aliases: ['happy', 'joy'],
			extension: 'webp',
			_updatedAt: new Date().toISOString(),
			etag: 'abcdef',
		},
	],
}));

describe('CustomEmoji Component', () => {
	const mockRef = { current: jest.fn() };
	const mockOnClick = jest.fn();

	it('renders emoji list', async () => {
		render(<CustomEmoji onClick={mockOnClick} reload={mockRef} />, {
			legacyRoot: true,
			wrapper: appRoot.build(),
		});

		await waitFor(() => {
			expect(screen.getByText('smile')).toBeInTheDocument();
		});
	});

	it("renders emoji's aliases as comma-separated values", async () => {
		render(<CustomEmoji onClick={mockOnClick} reload={mockRef} />, {
			legacyRoot: true,
			wrapper: appRoot.build(),
		});

		await waitFor(() => {
			expect(screen.getByText('happy, joy')).toBeInTheDocument();
		});
	});
});
