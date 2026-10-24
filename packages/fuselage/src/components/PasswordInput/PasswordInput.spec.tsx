import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
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

	it('keeps type="password" when spread props carry another type', () => {
		const props = { type: 'text' };
		render(<PasswordInput {...props} aria-label='Password' />);

		expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
	});
});
