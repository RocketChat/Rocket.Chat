import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';

import * as stories from './CustomSoundsTable.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const mockSounds = Array.from({ length: 50 }, (_, i) => ({
	_id: `sound-${i}`,
	name: `Custom Sound ${i + 1}`,
	extension: 'mp3',
}));

const getMockedAppRoot = () =>
	mockAppRoot().withEndpoint('GET', '/v1/custom-sounds.list', () => ({
		sounds: mockSounds.slice(0, 25),
		total: 50,
		count: 25,
		offset: 0,
	}));

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />, { wrapper: getMockedAppRoot().build() });
	expect(baseElement).toMatchSnapshot();
});

test('should enable pagination when data.total exceeds itemsPerPage', async () => {
	const { Default } = composeStories(stories);
	const { container } = render(<Default />, { wrapper: getMockedAppRoot().build() });

	const firstSound = await screen.findByText('Custom Sound 1');
	expect(firstSound).toBeInTheDocument();

	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	const forwardButton = container.querySelector('.rcx-pagination__forward');
	expect(forwardButton).toBeInTheDocument();
	expect(forwardButton).not.toBeDisabled();

	const pageTwoButton = screen.getByRole('button', { name: '2' });
	expect(pageTwoButton).toBeInTheDocument();
});
