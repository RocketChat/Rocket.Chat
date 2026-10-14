import { test } from 'node:test';

import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import sinon from 'sinon';

import * as stories from './RetentionPolicyCallout.stories';

let clock: sinon.SinonFakeTimers;

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

testCases.forEach(([_storyname, Story]) => {
	test(`renders ${_storyname} without crashing`, async (t) => {
		clock?.restore();
		clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
		clock.setSystemTime(new Date(2024, 5, 1, 0, 0, 0));

		const { baseElement } = render(<Story />);
		t.assert.snapshot(baseElement);
	});
});
testCases.forEach(([_storyname, Story]) => {
	test(`${_storyname} should have no a11y violations`, async () => {
		// We have to use real timers here because `jest-axe` is breaking otherwise
		clock?.restore();
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
