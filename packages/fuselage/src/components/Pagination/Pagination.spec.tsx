import { composeStories } from '@storybook/react-vite';
import { axe } from 'jest-axe';

import * as stories from './Pagination.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

jest.mock('react', () => ({
	...jest.requireActual('react'),
	useId: () => 'test-id',
}));

it('%s should have no a11y violations', async () => {
	const { container } = render(<Default />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('should override with custom aria-label', () => {
	const { getByLabelText } = render(<Default aria-label='Custom Pagination Navigation' />);

	expect(getByLabelText('Custom Pagination Navigation')).toBeInTheDocument();
});
