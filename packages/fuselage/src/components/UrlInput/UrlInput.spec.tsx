import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import UrlInput from './UrlInput';
import * as stories from './UrlInput.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[UrlInput Component]', () => {
	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('keeps type="url" when spread props carry another type', () => {
		const props = { type: 'text' };
		render(<UrlInput {...props} aria-label='Website' />);

		expect(screen.getByLabelText('Website')).toHaveAttribute('type', 'url');
	});
});
