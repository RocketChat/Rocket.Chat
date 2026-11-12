import { composeStories } from '@storybook/react';
import { screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useEffect, useState } from 'react';

import InputBox from './InputBox';
import * as stories from './InputBox.stories';
import { render } from '../../testing';

const { WithAddon, WithFlushEndAddon } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('should mark the input invalid when error changes asynchronously', async () => {
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
		expect(screen.getByRole('textbox', { name: /test-input/i })).toBeInvalid();
	});
});

it('should put className on the wrapper only when there is an addon', () => {
	render(<WithAddon className='custom' aria-label='with-addon' />);

	const input = screen.getByLabelText('with-addon', { selector: '.custom > input' });
	expect(input).not.toHaveClass('custom');
});

it('should put className on the input when there is no addon', () => {
	render(<InputBox type='text' className='custom' aria-label='plain' />);

	expect(screen.getByRole('textbox', { name: 'plain' })).toHaveClass('custom');
});

it('should flush the end addon only when requested', () => {
	render(
		<>
			<WithAddon aria-label='regular' />
			<WithFlushEndAddon aria-label='flush' />
		</>,
	);

	expect(
		screen.getByLabelText('regular', { selector: '.rcx-input-box__wrapper:not(.rcx-input-box__wrapper--end-addon-flush) > input' }),
	).toBeInTheDocument();
	expect(screen.getByLabelText('flush', { selector: '.rcx-input-box__wrapper--end-addon-flush > input' })).toBeInTheDocument();
});
