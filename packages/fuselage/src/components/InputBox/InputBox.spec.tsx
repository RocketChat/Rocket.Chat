import { composeStories } from '@storybook/react-webpack5';
import { waitFor } from '@testing-library/react';
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

	const { getByRole } = render(<TestComponent />);

	await waitFor(() => {
		expect(getByRole('textbox', { name: /test-input/i })).toBeInvalid();
	});
});

it('should put className on the wrapper only when there is an addon', () => {
	const { getByRole } = render(<WithAddon className='custom' aria-label='with-addon' />);

	const input = getByRole('textbox', { name: 'with-addon' });
	expect(input.parentElement).toHaveClass('custom');
	expect(input).not.toHaveClass('custom');
});

it('should put className on the input when there is no addon', () => {
	const { getByRole } = render(<InputBox type='text' className='custom' aria-label='plain' />);

	expect(getByRole('textbox', { name: 'plain' })).toHaveClass('custom');
});

it('should flush the end addon only when requested', () => {
	const { getAllByRole } = render(
		<>
			<WithAddon />
			<WithFlushEndAddon />
		</>,
	);

	const [regular, flush] = getAllByRole('textbox').map((input) => input.parentElement);
	expect(regular).not.toHaveClass('rcx-input-box__wrapper--end-addon-flush');
	expect(flush).toHaveClass('rcx-input-box__wrapper--end-addon-flush');
});
