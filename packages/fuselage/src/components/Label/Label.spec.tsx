import { composeStories } from '@storybook/react';
import { axe } from 'jest-axe';

import Label from './Label';
import * as stories from './Label.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Label Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	test('is="legend" renders the legend of a fieldset', () => {
		const { container } = render(
			<fieldset>
				<Label is='legend'>Format</Label>
			</fieldset>,
		);

		expect(container.querySelector('fieldset > legend')).toHaveTextContent('Format');
	});
});
