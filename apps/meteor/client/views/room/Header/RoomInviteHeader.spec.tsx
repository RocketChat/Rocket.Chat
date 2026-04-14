import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './RoomInviteHeader.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const appRoot = mockAppRoot().build();

jest.mock('../../../../app/utils/client', () => ({
	getURL: (url: string) => url,
}));

jest.mock('./ParentRoom', () => ({
	__esModule: true,
	default: jest.fn(() => <div>ParentRoom</div>),
}));

jest.mock('./RoomToolbox', () => ({
	__esModule: true,
	default: jest.fn(() => <div>RoomToolbox</div>),
}));

describe('RoomInviteHeader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const view = render(<Story />, { wrapper: appRoot });
		expect(view.baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />, { wrapper: appRoot });

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
