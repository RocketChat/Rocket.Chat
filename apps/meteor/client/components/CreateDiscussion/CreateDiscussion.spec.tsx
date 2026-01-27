import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import CreateDiscussion from './CreateDiscussion';
import * as stories from './CreateDiscussion.stories';
import { createFakeRoom } from '../../../tests/mocks/data';

jest.mock('../../lib/utils/goToRoomById', () => ({
	goToRoomById: jest.fn(),
}));

jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		getRoomDirectives: () => ({
			getRoomName: () => 'General',
		}),
	},
}));

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const room1 = createFakeRoom({ encrypted: true, fname: 'Encrypted Room 1' });
const room2 = createFakeRoom({ encrypted: false, fname: 'Unencrypted Room 2' });

const appRoot = mockAppRoot()
	.withEndpoint('POST', '/v1/rooms.createDiscussion', () => ({
		success: true,
		discussion: {
			...createFakeRoom({
				_id: 'discussion-id',
				t: 'p' as const,
				name: 'discussion-name',
				fname: 'Discussion Name',
				prid: 'parent-room-id',
			}),
			rid: 'discussion-id',
		} as any,
	}))
	.withEndpoint(
		'GET',
		'/v1/rooms.autocomplete.channelAndPrivate',
		() =>
			({
				items: [room1, room2],
			}) as any,
	)
	.withTranslations('en', 'core', {
		Encrypted: 'Encrypted',
		Unencrypted: 'Unencrypted',
		Discussion_first_message_title: 'Message',
		Discussion_target_channel: 'Parent channel or team',
	})
	.build();

describe('CreateDiscussion', () => {
	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />, { wrapper: appRoot });
		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />, { wrapper: appRoot });

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	describe('Encrypted parent room behavior', () => {
		it('should disable encrypted toggle and first message field when parent room is encrypted', () => {
			render(<CreateDiscussion onClose={jest.fn()} encryptedParentRoom={true} />, { wrapper: appRoot });

			const encryptedToggle = screen.getByRole('checkbox', { name: 'Encrypted' });
			expect(encryptedToggle).toBeDisabled();

			const firstMessageField = screen.getByLabelText('Message');
			expect(firstMessageField).toBeDisabled();
		});

		it('should disable encrypted toggle and first message field when an encrypted parent room is selected', async () => {
			render(<CreateDiscussion onClose={jest.fn()} />, { wrapper: appRoot });

			const parentRoomSelect = screen.getByRole('textbox', { name: 'Parent channel or team' });

			await userEvent.click(parentRoomSelect);

			await waitFor(() => {
				expect(screen.getByText('Encrypted Room 1')).toBeInTheDocument();
			});

			await userEvent.click(screen.getByText('Encrypted Room 1'));

			const encryptedToggle = screen.getByRole('checkbox', { name: 'Encrypted' });
			expect(encryptedToggle).toBeDisabled();

			const firstMessageField = screen.getByLabelText('Message');
			expect(firstMessageField).toBeDisabled();
		});
	});
});
