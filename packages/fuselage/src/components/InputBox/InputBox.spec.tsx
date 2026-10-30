import { composeStories } from '@storybook/react-webpack5';
import { waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useEffect, useState } from 'react';

import type { InputBoxProps } from './InputBox';
import * as stories from './InputBox.stories';
import { render } from '../../testing';

const { WithAddon, WithFlushEndAddon } = composeStories(stories);

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

it('does not accept an input prop', () => {
	// @ts-expect-error InputBox always renders its own control, so it takes no `input` element
	const props: InputBoxProps = { type: 'text', input: null };

	expect(props.type).toBe('text');
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
