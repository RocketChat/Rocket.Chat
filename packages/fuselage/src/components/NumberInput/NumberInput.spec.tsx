import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import NumberInput from './NumberInput';
import * as stories from './NumberInput.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[NumberInput Component]', () => {
	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('keeps type="number" when spread props carry another type', () => {
		const props = { type: 'text' };
		render(<NumberInput {...props} aria-label='Amount' />);

		expect(screen.getByLabelText('Amount')).toHaveAttribute('type', 'number');
	});
});
