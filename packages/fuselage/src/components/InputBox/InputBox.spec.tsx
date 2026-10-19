import { composeStories } from '@storybook/react-webpack5';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useEffect, useState } from 'react';

import * as stories from './InputBox.stories';
import { render } from '../../testing';

const { WithAddon } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const tree = render(<Story />);
	expect(tree.baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('should update error class when error changes asynchronously', async () => {
	const TestComponent = () => {
		const [error, setError] = useState<string | undefined>(undefined);

		useEffect(() => {
			setTimeout(() => {
				setError('Error');
			}, 100);
		}, []);

		return <WithAddon aria-label='test-input' error={error} />;
	};

	render(<TestComponent />);

	await waitFor(() => {
		const input = screen.getByRole('textbox', { name: /test-input/i }).parentElement as HTMLElement;
		expect(input).toHaveClass('invalid');
	});
});
