import { test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';

import * as stories from './BannedUsers.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

const appRoot = mockAppRoot()
	.wrap((children) => (
		<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 100 }}>{children}</VirtuosoMockContext.Provider>
	))
	.build();

testCases.forEach(([_storyname, Story]) => {
	test(`renders ${_storyname} without crashing`, async (t) => {
		const { baseElement } = render(<Story />, { wrapper: appRoot });
		t.assert.snapshot(baseElement);
	});
});
