import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import ReactionTooltip from './ReactionTooltip';
import { createFakeMessage } from '../../../../../tests/mocks/data';

const getMessage = jest.fn();

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

const renderTooltip = (props: Partial<ComponentProps<typeof ReactionTooltip>> = {}) =>
	render(<ReactionTooltip {...defaultProps} {...props} />, {
		wrapper: mockAppRoot().withTranslations('en', 'core', translations).withEndpoint('GET', '/v1/chat.getMessage', getMessage).build(),
	});

const givenReactions = (reactions: Record<string, { usernames: string[]; names?: string[] }> | undefined) =>
	getMessage.mockResolvedValue({ message: createFakeMessage({ _id: 'message-id', reactions }) });

describe('ReactionTooltip', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should tell the user who is the only one to react', async () => {
		renderTooltip({ usernames: [], mine: true });

		expect(await screen.findByText(/You reacted with/)).toBeInTheDocument();
		expect(getMessage).not.toHaveBeenCalled();
	});

	it('should list the users who reacted', async () => {
		renderTooltip();

		expect(await screen.findByText(/alice, bob reacted with/)).toBeInTheDocument();
		expect(getMessage).not.toHaveBeenCalled();
	});

	it('should put the user next to the others', async () => {
		renderTooltip({ mine: true });

		expect(await screen.findByText(/You and alice, bob reacted with/)).toBeInTheDocument();
	});

	it('should not fetch the message for real names when only the user reacted', async () => {
		renderTooltip({ usernames: [], mine: true, showRealName: true });

		expect(await screen.findByText(/You reacted with/)).toBeInTheDocument();
		expect(getMessage).not.toHaveBeenCalled();
	});

	it('should list exactly ten users with no count', async () => {
		renderTooltip({ usernames: usernames(10) });

		expect(await screen.findByText(/user10 reacted with/)).toBeInTheDocument();
	});

	it('should list exactly ten users with no count next to the user', async () => {
		renderTooltip({ usernames: usernames(10), mine: true });

		expect(await screen.findByText(/^You and user1.*user10 reacted with/)).toBeInTheDocument();
	});

	it('should list ten users and count the others', async () => {
		renderTooltip({ usernames: usernames(12) });

		expect(await screen.findByText(/user10 and 2 more reacted with/)).toBeInTheDocument();
		expect(screen.queryByText(/user11/)).not.toBeInTheDocument();
	});

	it('should list ten users and count the others next to the user', async () => {
		renderTooltip({ usernames: usernames(11), mine: true });

		expect(await screen.findByText(/^You, user1.*user10 and 1 more reacted with/)).toBeInTheDocument();
	});

	it('should show real names when the server is set to use them', async () => {
		givenReactions({ ':smile:': { usernames: ['alice', 'bob'], names: ['Alice A', 'Bob B'] } });

		renderTooltip({ showRealName: true });

		expect(await screen.findByText(/Alice A, Bob B reacted with/)).toBeInTheDocument();
	});

	it('should leave the name of the user out of the list', async () => {
		givenReactions({ ':smile:': { usernames: ['alice', 'me'], names: ['Alice A', 'Me M'] } });

		renderTooltip({ showRealName: true, usernames: ['alice'], mine: true });

		expect(await screen.findByText(/You and Alice A reacted with/)).toBeInTheDocument();
	});

	it('should leave the name of the user out when it comes first', async () => {
		givenReactions({ ':smile:': { usernames: ['me', 'alice'], names: ['Me M', 'Alice A'] } });

		renderTooltip({ showRealName: true, usernames: ['alice'], mine: true });

		expect(await screen.findByText(/You and Alice A reacted with/)).toBeInTheDocument();
	});

	it('should skip a user with no real name', async () => {
		givenReactions({ ':smile:': { usernames: ['alice', 'bob'], names: ['', 'Bob B'] } });

		renderTooltip({ showRealName: true });

		expect(await screen.findByText(/^Bob B reacted with/)).toBeInTheDocument();
	});

	it('should use usernames when the reaction has no names', async () => {
		givenReactions({ ':smile:': { usernames: ['alice', 'bob'] } });

		renderTooltip({ showRealName: true });

		expect(await screen.findByText(/alice, bob reacted with/)).toBeInTheDocument();
	});

	it('should use usernames for a logged-out viewer when the reaction has no names', async () => {
		givenReactions({ ':smile:': { usernames: ['alice', 'bob'] } });

		renderTooltip({ showRealName: true, username: undefined });

		expect(await screen.findByText(/alice, bob reacted with/)).toBeInTheDocument();
	});

	it('should list nobody when the message has no reactions anymore', async () => {
		givenReactions(undefined);

		renderTooltip({ showRealName: true });

		expect(await screen.findByText('reacted with :smile:')).toBeInTheDocument();
	});
});
