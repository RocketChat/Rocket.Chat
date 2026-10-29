import { createFakeMessage } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import BroadcastMetrics from './BroadcastMetrics';
import DiscussionMetrics from './DiscussionMetrics';
import * as stories from './Metrics.stories';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';

it('should open the discussion room', async () => {
	const { wrapper, navigation } = mockMessageProviders();
	render(<DiscussionMetrics rid='room' drid='discussion' count={3} lm={new Date()} />, { wrapper });

	await userEvent.click(screen.getByRole('button', { name: 'message_counter' }));

	expect(navigation.openRoom).toHaveBeenCalledWith('discussion');
});

it('should invite a reply to an empty discussion', () => {
	render(<DiscussionMetrics rid='room' drid='discussion' count={0} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
	expect(screen.getByText('No_messages_yet')).toBeInTheDocument();
});

it('should reply to a broadcast message through replyBroadcast', async () => {
	const message = createFakeMessage();
	const { wrapper, interactions } = mockMessageProviders();
	render(<BroadcastMetrics username='alice' message={message} />, { wrapper });

	await userEvent.click(screen.getByRole('button', { name: 'Reply' }));

	expect(interactions.replyBroadcast).toHaveBeenCalledWith(message);
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
