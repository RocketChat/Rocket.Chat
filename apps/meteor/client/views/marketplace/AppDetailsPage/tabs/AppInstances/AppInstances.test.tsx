import { test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';

import * as stories from './AppInstances.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

testCases.forEach(([_storyname, Story]) => {
	test(`renders AppInstances without crashing`, async (t) => {
		const view = render(<Story />, { wrapper: mockAppRoot().build() });

		t.assert.snapshot(view.baseElement);
	});
});
testCases.forEach(([_storyname, Story]) => {
	test(`AppInstances should have no a11y violations`, async () => {
		const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

		// Today we do not have exactly a pattern to handle menu cells that don't have a header
		const results = await axe(container, { rules: { 'empty-table-header': { enabled: false } } });

		expect(results).toHaveNoViolations();
	});
});
