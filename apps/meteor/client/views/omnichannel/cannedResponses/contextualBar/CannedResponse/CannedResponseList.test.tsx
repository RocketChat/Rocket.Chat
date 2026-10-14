import { describe, it, mock, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { fn } from 'jest-mock';

mock.module(require.resolve('@rocket.chat/ui-contexts'), {
	exports: {
		...require('@rocket.chat/ui-contexts'),

		useRoomToolbox: () => ({
			context: undefined,
		}),
	},
});
const { default: CannedResponseList }: typeof import('./CannedResponseList') = require('./CannedResponseList');
const stories: typeof import('./CannedResponseList.stories') = require('./CannedResponseList.stories');

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('CannedResponseList', () => {
	describe('Storybook Stories', () => {
		testCases.forEach(([_storyname, Story]) => {
			test(`renders ${_storyname} without crashing`, async (t) => {
				const { baseElement } = render(<Story />);
				t.assert.snapshot(baseElement);
			});
		});

		testCases.forEach(([_storyname, Story]) => {
			test(`${_storyname} should have no a11y violations`, async () => {
				const { container } = render(<Story />);

				const results = await axe(container, {
					rules: {
						'nested-interactive': { enabled: false },
					},
				});
				expect(results).toHaveNoViolations();
			});
		});
	});

	describe('Permission Testing', () => {
		const defaultProps = {
			loadMoreItems: fn<FunctionLike>(),
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
			onClose: fn<FunctionLike>(),
			loading: false,
			options: [['all', 'All'] as [string, string], ['global', 'Public'] as [string, string], ['user', 'Private'] as [string, string]],
			text: '',
			setText: fn<FunctionLike>(),
			type: 'all',
			setType: fn<FunctionLike>(),
			isRoomOverMacLimit: false,
			onClickItem: fn<FunctionLike>(),
			onClickCreate: fn<FunctionLike>(),
			onClickUse: fn<FunctionLike>(),
			reload: fn<FunctionLike>(),
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
