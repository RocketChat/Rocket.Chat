import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';

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
	const mockOnClick = jest.fn();

	it('renders emoji list', async () => {
		render(<CustomEmoji onClick={mockOnClick} />, {
			wrapper: appRoot.build(),
		});

		await waitFor(() => {
			expect(screen.getByText('smile')).toBeInTheDocument();
		});
	});

	it("renders emoji's aliases as comma-separated values when aliases is an array", async () => {
		render(<CustomEmoji onClick={mockOnClick} />, {
			wrapper: appRoot.build(),
		});

		await waitFor(() => {
			expect(screen.getByText('happy, joy')).toBeInTheDocument();
		});
	});

	it("renders emoji's aliases values when aliases is a string", async () => {
		render(<CustomEmoji onClick={mockOnClick} />, {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/emoji-custom.all', () => ({
					count: 1,
					offset: 0,
					total: 1,
					success: true,
					emojis: [
						{
							_id: '1',
							name: 'smile',
							aliases: 'happy' as any,
							extension: 'webp',
							_updatedAt: new Date().toISOString(),
							etag: 'abcdef',
						},
					],
				}))
				.build(),
		});

		await waitFor(() => {
			expect(screen.getByText('happy')).toBeInTheDocument();
		});
	});

	it('refetches the list when its query key is invalidated', async () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const getEmojiList = jest.fn(() => ({ count: 0, offset: 0, total: 0, success: true as const, emojis: [] }));

		render(<CustomEmoji onClick={mockOnClick} />, {
			wrapper: mockAppRoot().withQueryClient(queryClient).withEndpoint('GET', '/v1/emoji-custom.all', getEmojiList).build(),
		});

		await waitFor(() => expect(getEmojiList).toHaveBeenCalledTimes(1));

		await act(() => queryClient.invalidateQueries({ queryKey: ['getEmojiList'] }));

		expect(getEmojiList).toHaveBeenCalledTimes(2);
	});
});
