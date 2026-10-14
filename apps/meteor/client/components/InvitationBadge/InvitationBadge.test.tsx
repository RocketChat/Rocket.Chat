import { test } from 'node:test';

import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';

import * as stories from './InvitationBadge.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);
testCases.forEach(([_storyname, Story]) => {
	test(`renders ${_storyname} without crashing`, async (t) => {
		const { baseElement } = render(<Story />);
		t.assert.snapshot(baseElement);
	});
});
testCases.forEach(([_storyname, Story]) => {
	test(`${_storyname} should have no a11y violations`, async () => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
