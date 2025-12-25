import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './RoomFormAttributeField.stories';

describe('RoomFormAttributeField', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);
		expect(baseElement).toMatchSnapshot();
	});
});
