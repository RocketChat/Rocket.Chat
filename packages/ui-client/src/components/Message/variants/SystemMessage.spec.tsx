import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import SystemMessage from './SystemMessage';
import * as stories from './SystemMessage.stories';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';

const root = () =>
	mockAppRoot().withTranslations('en', 'core', {
		changed_room_description_to__room_description_: 'changed room description to: {{room_description}}',
	});

const createBaseMessage = (msg: string): IMessage =>
	createFakeMessage({ t: 'room_changed_description', msg, groupable: false, u: { _id: 'bob', username: 'bob', name: 'Bob' } });

describe('SystemMessage', () => {
	it('should render the text of its type', () => {
		render(<SystemMessage message={createBaseMessage('& test &')} />, { wrapper: mockMessageProviders({ root: root() }).wrapper });

		expect(screen.getByText('changed room description to: & test &')).toBeInTheDocument();
		expect(screen.queryByText('changed room description to: &amp; test &amp;')).not.toBeInTheDocument();
	});

	it('should not inject html', () => {
		render(<SystemMessage message={createBaseMessage('<button title="test-title">OK</button>')} />, {
			wrapper: mockMessageProviders({ root: root() }).wrapper,
		});

		expect(screen.queryByTitle('test-title')).not.toBeInTheDocument();
		expect(screen.getByText('changed room description to: <button title="test-title">OK</button>')).toBeInTheDocument();
	});

	it('should be a list item described as a system message', () => {
		render(<SystemMessage message={createBaseMessage('test')} />, { wrapper: mockMessageProviders({ root: root() }).wrapper });

		expect(screen.getByRole('listitem')).toHaveAttribute('aria-roledescription', 'system_message');
	});

	it('should hide the avatar when avatars are off', () => {
		render(<SystemMessage message={createBaseMessage('test')} />, {
			wrapper: mockMessageProviders({ root: root(), display: { showAvatars: false } }).wrapper,
		});

		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
	});

	describe('stories', () => {
		const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

		test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
			const { container } = render(<Story />);

			expect(await axe(container)).toHaveNoViolations();
		});
	});
});
