import { describe, it, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { fn } from 'jest-mock';

import UserAvatarChip from './UserAvatarChip';
import * as stories from './UserAvatarChip.stories';

describe('UserAvatarChip', () => {
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

			const results = await axe(container);
			expect(results).toHaveNoViolations();
		});
	});

	it('should pass extra props to the Chip component', () => {
		const handleClick = fn<FunctionLike>();
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
