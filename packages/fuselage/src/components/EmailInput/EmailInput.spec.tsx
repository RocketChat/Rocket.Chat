import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import EmailInput from './EmailInput';
import * as stories from './EmailInput.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[EmailInput Component]', () => {
	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('keeps type="email" when spread props carry another type', () => {
		const props = { type: 'text' };
		render(<EmailInput {...props} aria-label='Email' />);

		expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
	});
});
