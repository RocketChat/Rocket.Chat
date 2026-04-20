import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';

import * as stories from './CustomSoundsTable.stories';

const mockSounds = Array.from({ length: 25 }, (_, i) => ({
	_id: `sound-${i}`,
	name: `Custom Sound ${i + 1}`,
	extension: 'mp3',
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
