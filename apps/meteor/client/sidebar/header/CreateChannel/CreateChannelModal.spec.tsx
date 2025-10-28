import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import CreateChannelModal from './CreateChannelModal';
import * as stories from './CreateChannelModal.stories';
import { testCreateChannelModal } from '../../../NavBarV2/NavBarPagesGroup/actions/testCreateChannelModal';

jest.mock('../../../lib/utils/goToRoomById', () => ({
	goToRoomById: jest.fn(),
}));

testCreateChannelModal(CreateChannelModal);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
	const { baseElement } = render(<Story />, { wrapper: mockAppRoot().build() });
	expect(baseElement).toMatchSnapshot();
});

test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
	const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
