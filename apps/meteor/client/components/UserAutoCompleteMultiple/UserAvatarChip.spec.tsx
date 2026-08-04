import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import UserAvatarChip from './UserAvatarChip';
import * as stories from './UserAvatarChip.stories';

describe('UserAvatarChip', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);
		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should pass extra props to the Chip component', () => {
		const handleClick = jest.fn();
		render(<UserAvatarChip username='testuser' onClick={handleClick} />);
		screen.getByRole('button').click();
		expect(handleClick).toHaveBeenCalled();
	});

	it('should render real name if the setting is enabled', () => {
		render(<UserAvatarChip username='testuser' name='Test User' />, {
			wrapper: mockAppRoot().withSetting('UI_Use_Real_Name', true).build(),
		});
		expect(screen.getByText('Test User')).toBeInTheDocument();
	});
});
