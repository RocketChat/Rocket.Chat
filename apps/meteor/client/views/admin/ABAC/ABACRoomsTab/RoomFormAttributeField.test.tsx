import { describe, test } from 'node:test';

import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './RoomFormAttributeField.stories';

describe('RoomFormAttributeField', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

	testCases.forEach(([_storyname, Story]) => {
		test(`renders ${_storyname} without crashing`, async (t) => {
			const { baseElement } = render(<Story />);
			t.assert.snapshot(baseElement);
		});
	});
});
