import { composeStories } from '@storybook/react-webpack5';
import { waitFor, screen } from '@testing-library/react';
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

it('should render custom input when input prop is provided', () => {
	render(<InputBox type='text' input={<input data-testid='custom-input' defaultValue='custom' />} />);

	expect(screen.getByTestId('custom-input')).toBeInTheDocument();
	expect(screen.queryByRole('textbox')).toHaveValue('custom');
});

it('should render custom input inside InputBoxWrapper when addons are present', () => {
	render(
		<InputBox
			type='text'
			startAddon={<span data-testid='custom-addon'>addon</span>}
			input={<input data-testid='custom-input-with-addon' />}
		/>,
	);

	expect(screen.getByTestId('custom-addon')).toBeInTheDocument();
	expect(screen.getByTestId('custom-input-with-addon')).toBeInTheDocument();
});

it('should not leak input prop as a DOM attribute', () => {
	render(<InputBox type='text' data-testid='default-input' />);

	const input = screen.getByTestId('default-input');
	expect(input).not.toHaveAttribute('input');
});
