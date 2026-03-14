import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './MediaCallHistoryTable.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('Snapshots', () => {
	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date(2025, 5, 1, 12, 0, 0));
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		console.log('new date', new Date());
		const view = render(<Story />);
		expect(view.baseElement).toMatchSnapshot();
	});
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />);

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
