import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as stories from './CustomSoundsTable.stories';

const mockSounds = Array.from({ length: 25 }, (_, i) => ({
	_id: `sound-${i}`,
	name: `Custom Sound ${i + 1}`,
	extension: 'mp3',
	_updatedAt: '2024-01-01T00:00:00.000Z',
}));

const getMockedAppRoot = () =>
	mockAppRoot().withEndpoint('GET', '/v1/custom-sounds.list', () => ({
		sounds: mockSounds,
		total: 50,
		count: 25,
		offset: 0,
	}));

test('should enable pagination when data.total exceeds itemsPerPage', async () => {
	const { Default } = composeStories(stories);
	render(<Default />, { wrapper: getMockedAppRoot().build() });

	const firstSound = await screen.findByText('Custom Sound 1');
	expect(firstSound).toBeInTheDocument();

	const nextPageButton = screen.getByRole('button', { name: 'Next page' });
	expect(nextPageButton).toBeInTheDocument();
	expect(nextPageButton).not.toBeDisabled();

	const pageTwoButton = screen.getByRole('button', { name: 'Page 2' });
	expect(pageTwoButton).toBeInTheDocument();
});

test('should fill each page under the server limit and go back to the first page when filtering', async () => {
	const limit = 10;
	const total = 60;
	const getSounds = jest.fn(({ offset = 0, count = 25 }: { offset?: number; count?: number; name?: string }) => {
		const sounds = Array.from({ length: Math.max(0, Math.min(count, limit, total - offset)) }, (_, i) => ({
			_id: `sound-${offset + i}`,
			name: `sound-${offset + i}`,
			extension: 'mp3',
			_updatedAt: '2024-01-01T00:00:00.000Z',
		}));
		return { sounds, count: sounds.length, offset, total };
	});

	const { Default } = composeStories(stories);
	render(<Default />, { wrapper: mockAppRoot().withEndpoint('GET', '/v1/custom-sounds.list', getSounds).build() });

	expect(await screen.findByText('sound-24')).toBeInTheDocument();
	expect(screen.queryByText('sound-25')).not.toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));

	expect(await screen.findByText('sound-49')).toBeInTheDocument();
	expect(screen.queryByText('sound-24')).not.toBeInTheDocument();

	getSounds.mockClear();
	await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'sound');

	await waitFor(() => expect(getSounds).toHaveBeenCalledWith(expect.objectContaining({ name: 'sound', offset: 0 })));
	expect(getSounds).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'sound', offset: 25 }));
});
