import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import TextInput from './TextInput';
import * as stories from './TextInput.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[TextInput Component]', () => {
	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('keeps type="text" when spread props carry another type', () => {
		const props = { type: 'hidden' };
		render(<TextInput {...props} aria-label='Name' />);

		expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'text');
	});
});
