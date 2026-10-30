import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './AppLogsItem.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)('AppLogsItem should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });
	const results = await axe(container);
	expect(results).toHaveNoViolations();
});

it('renders the Instance label through the translator', () => {
	const wrapper = mockAppRoot()
		.withTranslations('en', 'core', { Instance: 'TRANSLATED_INSTANCE' })
		.build();

	const { Simple } = composeStories(stories);

	render(<Simple />, { wrapper });

	expect(screen.getByText('TRANSLATED_INSTANCE')).toBeInTheDocument();
});
