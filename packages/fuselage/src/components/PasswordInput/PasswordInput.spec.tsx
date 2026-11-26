import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import PasswordInput from './PasswordInput';
import * as stories from './PasswordInput.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[PasswordInput Component]', () => {
	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('hides the text until the eye is clicked, then hides it again', async () => {
		render(<PasswordInput placeholder='Password' />);
		const input = screen.getByPlaceholderText('Password');
		const eye = screen.getByText((_, element) => element?.tagName === 'I');

		expect(input).toHaveAttribute('type', 'password');

		await userEvent.click(eye);
		expect(input).toHaveAttribute('type', 'text');

		await userEvent.click(eye);
		expect(input).toHaveAttribute('type', 'password');
	});
});
