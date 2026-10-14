import { test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';

import * as stories from './UsersTable.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

testCases.forEach(([_storyname, Story]) => {
	test(`renders ${_storyname} without crashing`, async (t) => {
		const { baseElement } = render(<Story />, { wrapper: mockAppRoot().build() });
		t.assert.snapshot(baseElement);
	});
});
testCases.forEach(([_storyname, Story]) => {
	test(`${_storyname} should have no a11y violations`, async () => {
		const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

		// TODO: Needed to skip `button-name` because fuselage‘s `Pagination` buttons are missing names
		const results = await axe(container, { rules: { 'button-name': { enabled: false } } });
		expect(results).toHaveNoViolations();
	});
});
