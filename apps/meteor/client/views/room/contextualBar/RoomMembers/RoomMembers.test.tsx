import { mock, test } from 'node:test';

import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

mock.module('../../hooks/useUserInfoActions', {
	exports: {
		useUserInfoActions: fn<FunctionLike>(),
	},
});
const stories: typeof import('./RoomMembers.stories') = require('./RoomMembers.stories');

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

		// Disable 'nested-interactive' rule because our `Select` component is still not a11y compliant
		const results = await axe(container, { rules: { 'nested-interactive': { enabled: false } } });
		expect(results).toHaveNoViolations();
	});
});
