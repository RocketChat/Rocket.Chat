import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import StatusIcon from './StatusIcon';
import * as stories from './StatusIcon.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[StatusIcon rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('colours the icon by its status and passes DOM attributes through', () => {
		render(<StatusIcon name='key' status='danger' title='Encrypted' aria-hidden='false' role='img' />);

		const icon = screen.getByRole('img', { name: 'Encrypted' });
		expect(icon).toHaveClass('rcx-icon', 'rcx-status-icon', 'rcx-status-icon--danger');
	});
});
