import nameToCharacterMapping from '@rocket.chat/icons';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import ConferenceStatePage from './ConferenceStatePage.js';
import * as stories from './ConferenceStatePage.stories.js';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { baseElement } = render(<Story />);

	// `region` off: the page is rendered on its own here; in the product the conference window is the whole page.
	// `heading-order` off: every state page puts Fuselage's `h3` state title under the page's `h1`.
	const results = await axe(baseElement, { rules: { 'region': { enabled: false }, 'heading-order': { enabled: false } } });
	expect(results).toHaveNoViolations();
});

const getIcon = (variation?: 'danger' | 'neutral') => {
	render(<ConferenceStatePage icon='warning' title='Something happened' variation={variation} />, { wrapper: mockAppRoot().build() });

	return screen.getByText(nameToCharacterMapping.warning, { selector: 'i' });
};

// Every page that existed before the variation was added reports a failure, and must keep looking like one.
it('draws the icon as an error by default', () => {
	expect(getIcon()).toHaveClass('rcx-states__icon', 'rcx-states__icon--danger');
});

it('draws the icon without the danger class when neutral', () => {
	const icon = getIcon('neutral');

	expect(icon).toHaveClass('rcx-states__icon');
	expect(icon).not.toHaveClass('rcx-states__icon--danger');
});

it('shows each variation in its own story', () => {
	const { Danger, Neutral } = composeStories(stories);

	const { unmount } = render(<Danger />);
	expect(screen.getByText(nameToCharacterMapping.warning, { selector: 'i' })).toHaveClass('rcx-states__icon--danger');
	unmount();

	render(<Neutral />);
	expect(screen.getByText(nameToCharacterMapping.clock, { selector: 'i' })).not.toHaveClass('rcx-states__icon--danger');
});
