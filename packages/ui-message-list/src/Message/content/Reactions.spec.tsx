import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { TooltipProvider } from '@rocket.chat/ui-client';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps, ReactNode } from 'react';

import Reactions from './Reactions';
import * as stories from './Reactions.stories';
import ReactionTooltip from './reactions/ReactionTooltip';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';

const message = createFakeMessage({
	_id: 'reacted',
	reactions: {
		':smile:': { usernames: ['alice', 'bob'] },
		':tada:': { usernames: ['carol'] },
	},
});

it('should show each reaction with its emoji and count (R11)', () => {
	render(<Reactions message={message} />, {
		wrapper: mockMessageProviders({ content: { getEmojiData: (name) => ({ name, content: `emoji ${name}` }) } }).wrapper,
	});

	expect(screen.getAllByRole('button', { name: 'React_with__reaction__' })).toHaveLength(2);
	expect(screen.getByText('emoji :smile:')).toBeInTheDocument();
	expect(screen.getByText('2')).toBeInTheDocument();
	expect(screen.getByText('1')).toBeInTheDocument();
});

it('should toggle a reaction through toggleReaction (R12)', async () => {
	const { wrapper, interactions } = mockMessageProviders();
	render(<Reactions message={message} />, { wrapper });

	await userEvent.click(screen.getByText(':tada:'));

	expect(interactions.toggleReaction).toHaveBeenCalledWith(message, ':tada:');
});

it('should ask whether the viewer reacted with each reaction (R13)', () => {
	const { wrapper, interactions } = mockMessageProviders();
	render(<Reactions message={message} />, { wrapper });

	expect(interactions.hasReacted).toHaveBeenCalledWith(message, ':smile:');
	expect(interactions.hasReacted).toHaveBeenCalledWith(message, ':tada:');
});

it('should open the reaction picker for the message (R12)', async () => {
	const { wrapper, interactions } = mockMessageProviders();
	render(<Reactions message={message} />, { wrapper });

	await userEvent.click(screen.getByTitle('Add_Reaction'));

	expect(interactions.openReactionPicker).toHaveBeenCalledWith(expect.anything(), message);
});

describe('ReactionTooltip', () => {
	const tooltipTranslations = ['en', 'core', { Users_reacted_with: '{{users}} reacted with {{emoji}}' }] as const;

	it('should list usernames without fetching the message when real names are off (R14)', () => {
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

		expect(useMessageById).toHaveBeenCalledWith('reacted', expect.objectContaining({ enabled: false }));
		expect(screen.getByText('@alice, @bob reacted with :smile:')).toBeInTheDocument();
	});

	it('should list the real names of the message reactions (R14)', () => {
		const reacted = createFakeMessage({ _id: 'reacted', reactions: { ':smile:': { usernames: ['alice', 'me'], names: ['Alice', 'Me'] } } });
		const useMessageById = jest.fn(() => ({ data: reacted, isLoading: false, isError: false }));
		render(<ReactionTooltip emojiName=':smile:' usernames={['alice']} mine={false} messageId='reacted' showRealName username='me' />, {
			wrapper: mockMessageProviders({
				relatedData: { useMessageById },
				root: mockAppRoot().withTranslations(...tooltipTranslations),
			}).wrapper,
		});

		expect(useMessageById).toHaveBeenCalledWith('reacted', expect.objectContaining({ enabled: true }));
		expect(screen.getByText('Alice reacted with :smile:')).toBeInTheDocument();
	});
});

describe('who a reaction tooltip lists', () => {
	const translations = {
		You_reacted_with: 'You reacted with {{emoji}}',
		You_users_and_more_Reacted_with: 'You, {{users}} and {{counter}} more reacted with {{emoji}}',
		Users_and_more_reacted_with: '{{users}} and {{counter}} more reacted with {{emoji}}',
		You_and_users_Reacted_with: 'You and {{users}} reacted with {{emoji}}',
		Users_reacted_with: '{{users}} reacted with {{emoji}}',
	};

	const defaultProps = {
		emojiName: ':smile:',
		usernames: ['alice', 'bob'],
		username: 'me',
		mine: false,
		showRealName: false,
		messageId: 'message-id',
	};

	const usernames = (count: number) => Array.from({ length: count }, (_, index) => `user${index + 1}`);

	type Reactions = Record<string, { usernames: string[]; names?: string[] }> | undefined;

	// The message the app answers with when the tooltip asks for real names
	const showTooltip = (props: Partial<ComponentProps<typeof ReactionTooltip>> = {}, reactions?: Reactions) => {
		const fetched = createFakeMessage({ _id: 'message-id', reactions });
		const useMessageById = jest.fn(() => ({ data: fetched, isLoading: false, isError: false }));
		render(<ReactionTooltip {...defaultProps} {...props} />, {
			wrapper: mockMessageProviders({
				relatedData: { useMessageById },
				root: mockAppRoot().withTranslations('en', 'core', translations),
			}).wrapper,
		});
		return useMessageById;
	};

	const notFetched = (useMessageById: jest.Mock) =>
		expect(useMessageById).toHaveBeenCalledWith('message-id', expect.objectContaining({ enabled: false }));

	it('should tell the user who is the only one to react (R14)', async () => {
		const useMessageById = showTooltip({ usernames: [], mine: true });

		expect(await screen.findByText(/You reacted with/)).toBeInTheDocument();
		notFetched(useMessageById);
	});

	it('should list the users who reacted (R14)', async () => {
		const useMessageById = showTooltip();

		expect(await screen.findByText(/alice, bob reacted with/)).toBeInTheDocument();
		notFetched(useMessageById);
	});

	it('should put the user next to the others (R14)', async () => {
		showTooltip({ mine: true });

		expect(await screen.findByText(/You and alice, bob reacted with/)).toBeInTheDocument();
	});

	it('should not fetch the message for real names when only the user reacted (R14)', async () => {
		const useMessageById = showTooltip({ usernames: [], mine: true, showRealName: true });

		expect(await screen.findByText(/You reacted with/)).toBeInTheDocument();
		notFetched(useMessageById);
	});

	it('should list exactly ten users with no count (R14)', async () => {
		showTooltip({ usernames: usernames(10) });

		expect(await screen.findByText(/user10 reacted with/)).toBeInTheDocument();
	});

	it('should list exactly ten users with no count next to the user (R14)', async () => {
		showTooltip({ usernames: usernames(10), mine: true });

		expect(await screen.findByText(/^You and user1.*user10 reacted with/)).toBeInTheDocument();
	});

	it('should list ten users and count the others (R14)', async () => {
		showTooltip({ usernames: usernames(12) });

		expect(await screen.findByText(/user10 and 2 more reacted with/)).toBeInTheDocument();
		expect(screen.queryByText(/user11/)).not.toBeInTheDocument();
	});

	it('should list ten users and count the others next to the user (R14)', async () => {
		showTooltip({ usernames: usernames(11), mine: true });

		expect(await screen.findByText(/^You, user1.*user10 and 1 more reacted with/)).toBeInTheDocument();
	});

	it('should show real names when the server is set to use them (R14)', async () => {
		showTooltip({ showRealName: true }, { ':smile:': { usernames: ['alice', 'bob'], names: ['Alice A', 'Bob B'] } });

		expect(await screen.findByText(/Alice A, Bob B reacted with/)).toBeInTheDocument();
	});

	it('should leave the name of the user out of the list (R14)', async () => {
		showTooltip(
			{ showRealName: true, usernames: ['alice'], mine: true },
			{ ':smile:': { usernames: ['alice', 'me'], names: ['Alice A', 'Me M'] } },
		);

		expect(await screen.findByText(/You and Alice A reacted with/)).toBeInTheDocument();
	});

	it('should leave the name of the user out when it comes first (R14)', async () => {
		showTooltip(
			{ showRealName: true, usernames: ['alice'], mine: true },
			{ ':smile:': { usernames: ['me', 'alice'], names: ['Me M', 'Alice A'] } },
		);

		expect(await screen.findByText(/You and Alice A reacted with/)).toBeInTheDocument();
	});

	it('should skip a user with no real name (R14)', async () => {
		showTooltip({ showRealName: true }, { ':smile:': { usernames: ['alice', 'bob'], names: ['', 'Bob B'] } });

		expect(await screen.findByText(/^Bob B reacted with/)).toBeInTheDocument();
	});

	it('should use usernames when the reaction has no names (R14)', async () => {
		showTooltip({ showRealName: true }, { ':smile:': { usernames: ['alice', 'bob'] } });

		expect(await screen.findByText(/alice, bob reacted with/)).toBeInTheDocument();
	});

	it('should use usernames for a logged-out viewer when the reaction has no names (R14)', async () => {
		showTooltip({ showRealName: true, username: undefined }, { ':smile:': { usernames: ['alice', 'bob'] } });

		expect(await screen.findByText(/alice, bob reacted with/)).toBeInTheDocument();
	});

	it('should list nobody when the message has no reactions anymore (R14)', async () => {
		showTooltip({ showRealName: true }, undefined);

		expect(await screen.findByText('reacted with :smile:')).toBeInTheDocument();
	});
});

it('should name who reacted with real names although the tooltip renders above the message providers (R14)', async () => {
	const reacted = createFakeMessage({ _id: 'reacted', reactions: { ':smile:': { usernames: ['alice', 'bob'], names: ['Alice', 'Bob'] } } });
	const useMessageById = jest.fn(() => ({ data: reacted, isLoading: false, isError: false }));

	const AppRoot = mockAppRoot()
		.withTranslations('en', 'core', { Users_reacted_with: '{{users}} reacted with {{emoji}}' })
		.wrap((children: ReactNode) => <TooltipProvider>{children}</TooltipProvider>)
		.build();
	const MessageProviders = mockMessageProviders({ display: { showRealName: true }, relatedData: { useMessageById } }).wrapper;

	render(<Reactions message={reacted} />, {
		wrapper: ({ children }: { children: ReactNode }) => (
			<AppRoot>
				<MessageProviders>{children}</MessageProviders>
			</AppRoot>
		),
	});

	await userEvent.hover(screen.getAllByRole('button', { name: 'React_with__reaction__' })[0]);

	expect(await screen.findByText(/Alice, Bob reacted with/)).toBeInTheDocument();
});

describe('the revision of the message a tooltip asks for', () => {
	const asked = (emojiName: string, usernames: string[]) => {
		const useMessageById = jest.fn(() => ({ data: undefined, isLoading: true, isError: false }));
		render(<ReactionTooltip emojiName={emojiName} usernames={usernames} mine={false} messageId='reacted' showRealName username='me' />, {
			wrapper: mockMessageProviders({ relatedData: { useMessageById }, root: mockAppRoot() }).wrapper,
		});

		return (useMessageById.mock.calls[0] as unknown as [string, { revision: unknown[] }])[1].revision;
	};

	it('should change when the people who reacted change (R14)', () => {
		expect(asked(':smile:', ['alice'])).not.toEqual(asked(':smile:', ['alice', 'bob']));
	});

	it('should change when the emoji changes (R14)', () => {
		expect(asked(':smile:', ['alice'])).not.toEqual(asked(':tada:', ['alice']));
	});

	it('should stay the same while the emoji and the people who reacted do (R14)', () => {
		expect(asked(':smile:', ['alice'])).toEqual(asked(':smile:', ['alice']));
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations (R24)', async (_storyName, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
