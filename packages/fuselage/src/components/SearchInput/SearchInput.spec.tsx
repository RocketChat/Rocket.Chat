import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import SearchInput from './SearchInput';
import * as stories from './SearchInput.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[SearchInput Component]', () => {
	it('renders without crashing', () => {
		const tree = render(<Default />);
		expect(tree.baseElement).toMatchSnapshot();
	});

	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('keeps type="search" when spread props carry another type', () => {
		const props = { type: 'text' };
		render(<SearchInput {...props} aria-label='Search' />);

		expect(screen.getByLabelText('Search')).toHaveAttribute('type', 'search');
	});
});
