import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './CallParticipants.stories';

/**
 * What this component does is render, so what is tested is what it renders: each story is a case — every face
 * shown, more people than faces, a lone face, no faces at all, avatars turned off — and the snapshot is the
 * answer. The cases are named in the stories rather than in `it` blocks, and the stories are also what the
 * component is read in.
 */
const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('CallParticipants', () => {
	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);

		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
