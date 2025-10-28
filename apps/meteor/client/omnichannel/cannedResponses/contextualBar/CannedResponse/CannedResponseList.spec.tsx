import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import CannedResponseList from './CannedResponseList';
import * as stories from './CannedResponseList.stories';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

// Mock the useRoomToolbox hook
jest.mock('../../../../views/room/contexts/RoomToolboxContext', () => ({
	useRoomToolbox: () => ({
		context: undefined,
	}),
}));

describe('CannedResponseList', () => {
	describe('Storybook Stories', () => {
		test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
			const { baseElement } = render(<Story />);
			expect(baseElement).toMatchSnapshot();
		});

		test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
			const { container } = render(<Story />);

			const results = await axe(container, {
				rules: {
					'nested-interactive': { enabled: false },
				},
			});
			expect(results).toHaveNoViolations();
		});
	});

	describe('Permission Testing', () => {
		const defaultProps = {
			loadMoreItems: jest.fn(),
			cannedItems: [
				{
					shortcut: 'test',
					text: 'simple canned response test',
					scope: 'global',
					tags: ['sales', 'support'],
					_createdAt: new Date(),
					_id: 'test',
					_updatedAt: new Date(),
					createdBy: {
						_id: 'rocket.cat',
						username: 'rocket.cat',
					},
					departmentName: '',
					userId: 'rocket.cat',
					departmentId: '',
				},
			],
			itemCount: 1,
			onClose: jest.fn(),
			loading: false,
			options: [['all', 'All'] as [string, string], ['global', 'Public'] as [string, string], ['user', 'Private'] as [string, string]],
			text: '',
			setText: jest.fn(),
			type: 'all',
			setType: jest.fn(),
			isRoomOverMacLimit: false,
			onClickItem: jest.fn(),
			onClickCreate: jest.fn(),
			onClickUse: jest.fn(),
			reload: jest.fn(),
		};

		it('should render Create button when user has save-canned-responses permission', () => {
			render(<CannedResponseList {...defaultProps} />, {
				wrapper: mockAppRoot()
					.withTranslations('en', 'core', {
						Create: 'Create',
					})
					.withPermission('save-canned-responses')
					.build(),
			});

			expect(screen.getByText('Create')).toBeInTheDocument();
		});

		it('should NOT render Create button when user has only save-department-canned-responses permission', () => {
			render(<CannedResponseList {...defaultProps} />, {
				wrapper: mockAppRoot()
					.withTranslations('en', 'core', {
						Create: 'Create',
					})
					.withPermission('save-department-canned-responses')
					.build(),
			});

			expect(screen.getByText('Create')).toBeInTheDocument();
		});

		it('should render Create button when user has both permissions', () => {
			render(<CannedResponseList {...defaultProps} />, {
				wrapper: mockAppRoot()
					.withTranslations('en', 'core', {
						Create: 'Create',
					})
					.withPermission('save-canned-responses')
					.withPermission('save-department-canned-responses')
					.build(),
			});

			expect(screen.getByText('Create')).toBeInTheDocument();
		});

		it('should NOT render Create button when user has neither permission', () => {
			render(<CannedResponseList {...defaultProps} />, {
				wrapper: mockAppRoot()
					.withTranslations('en', 'core', {
						Create: 'Create',
					})
					.build(),
			});

			expect(screen.queryByText('Create')).not.toBeInTheDocument();
		});
	});
});
