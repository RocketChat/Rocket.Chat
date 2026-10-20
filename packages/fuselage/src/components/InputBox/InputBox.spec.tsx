import { composeStories } from '@storybook/react-webpack5';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useEffect, useState } from 'react';

import InputBox from './InputBox';
import * as stories from './InputBox.stories';
import { render } from '../../testing';

const { WithAddon } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

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

	const { getByRole } = render(<TestComponent />);

	await waitFor(() => {
		const input = getByRole('textbox', { name: /test-input/i }).parentElement as HTMLElement;
		expect(input).toHaveClass('invalid');
	});
});

it.each([
	['bare', {}],
	['with addon', { endAddon: 'x' }],
])('calls onChange once per keystroke (%s)', async (_name, extraProps) => {
	const onChange = jest.fn();
	render(<InputBox type='text' aria-label='test-input' onChange={onChange} {...extraProps} />);

	await userEvent.type(screen.getByRole('textbox', { name: 'test-input' }), 'Hi');

	expect(onChange).toHaveBeenCalledTimes(2);
});
