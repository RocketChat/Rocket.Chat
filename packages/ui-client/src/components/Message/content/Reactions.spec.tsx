import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import Reactions from './Reactions';
import * as stories from './Reactions.stories';
import ReactionTooltip from './reactions/ReactionTooltip';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';

const message = createFakeMessage({
	_id: 'reacted',
	reactions: {
		':smile:': { usernames: ['alice', 'bob'] },
		':tada:': { usernames: ['carol'] },
	},
});

it('should show each reaction with its emoji and count', () => {
	render(<Reactions message={message} />, {
		wrapper: mockMessageProviders({ content: { getEmojiData: (name) => ({ name, content: `emoji ${name}` }) } }).wrapper,
	});

	expect(screen.getAllByRole('button', { name: 'React_with__reaction__' })).toHaveLength(2);
	expect(screen.getByText('emoji :smile:')).toBeInTheDocument();
	expect(screen.getByText('2')).toBeInTheDocument();
	expect(screen.getByText('1')).toBeInTheDocument();
});

it('should toggle a reaction through toggleReaction', async () => {
	const { wrapper, interactions } = mockMessageProviders();
	render(<Reactions message={message} />, { wrapper });

	await userEvent.click(screen.getByText(':tada:'));

	expect(interactions.toggleReaction).toHaveBeenCalledWith(message, ':tada:');
});

it('should ask whether the viewer reacted with each reaction', () => {
	const { wrapper, interactions } = mockMessageProviders();
	render(<Reactions message={message} />, { wrapper });

	expect(interactions.hasReacted).toHaveBeenCalledWith(message, ':smile:');
	expect(interactions.hasReacted).toHaveBeenCalledWith(message, ':tada:');
});

it('should open the reaction picker for the message', async () => {
	const { wrapper, interactions } = mockMessageProviders();
	render(<Reactions message={message} />, { wrapper });

	await userEvent.click(screen.getByTitle('Add_Reaction'));

	expect(interactions.openReactionPicker).toHaveBeenCalledWith(expect.anything(), message);
});

describe('ReactionTooltip', () => {
	const tooltipTranslations = ['en', 'core', { Users_reacted_with: '{{users}} reacted with {{emoji}}' }] as const;

	it('should list usernames without fetching the message when real names are off', () => {
		const useMessageById = jest.fn(() => ({ data: undefined, isLoading: true, isError: false }));
		render(
			<ReactionTooltip
				emojiName=':smile:'
				usernames={['@alice', '@bob']}
				mine={false}
				messageId='reacted'
				showRealName={false}
				username='me'
			/>,
			{
				wrapper: mockMessageProviders({
					relatedData: { useMessageById },
					root: mockAppRoot().withTranslations(...tooltipTranslations),
				}).wrapper,
			},
		);

		expect(useMessageById).toHaveBeenCalledWith('reacted', { enabled: false });
		expect(screen.getByText('@alice, @bob reacted with :smile:')).toBeInTheDocument();
	});

	it('should list the real names of the message reactions', () => {
		const reacted = createFakeMessage({ _id: 'reacted', reactions: { ':smile:': { usernames: ['alice', 'me'], names: ['Alice', 'Me'] } } });
		const useMessageById = jest.fn(() => ({ data: reacted, isLoading: false, isError: false }));
		render(<ReactionTooltip emojiName=':smile:' usernames={['alice']} mine={false} messageId='reacted' showRealName username='me' />, {
			wrapper: mockMessageProviders({
				relatedData: { useMessageById },
				root: mockAppRoot().withTranslations(...tooltipTranslations),
			}).wrapper,
		});

		expect(useMessageById).toHaveBeenCalledWith('reacted', { enabled: true });
		expect(screen.getByText('Alice reacted with :smile:')).toBeInTheDocument();
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
