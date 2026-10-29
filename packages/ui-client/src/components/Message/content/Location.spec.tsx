import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import Location from './Location';
import * as stories from './Location.stories';

it('should link to the shared location when there is no maps key', () => {
	render(<Location location={{ type: 'Point', coordinates: [-48.5, -27.5] }} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByRole('link', { name: 'Shared_Location' })).toHaveAttribute('href', 'https://maps.google.com/maps?daddr=-27.5,-48.5');
});

it('should render nothing without coordinates', () => {
	const { container } = render(<Location />, { wrapper: mockAppRoot().build() });

	expect(container).toBeEmptyDOMElement();
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
