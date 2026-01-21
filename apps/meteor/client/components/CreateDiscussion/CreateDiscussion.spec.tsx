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

describe('CreateDiscussion', () => {
	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const { baseElement } = render(<Story />);
		expect(baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	describe('Encrypted parent room behavior', () => {
		it('should disable encrypted toggle and first message field when parent room is encrypted', () => {
			const room1 = createFakeRoom({ encrypted: true, fname: 'Room 1' });
			const room2 = createFakeRoom({ encrypted: false, fname: 'Room 2' });

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
						// Just a mock
					} as any,
				}))
				.withEndpoint(
					'GET',
					'/v1/rooms.autocomplete.channelAndPrivate',
					() =>
						({
							items: [room1, room2],
							// Just a mock
						}) as any,
				)
				.build();

			render(<CreateDiscussion onClose={jest.fn()} encryptedParentRoom={true} />, { wrapper: appRoot });

			const encryptedToggle = screen.getByRole('checkbox', { name: 'Encrypted' });
			expect(encryptedToggle).toBeDisabled();

			const firstMessageField = screen.getByLabelText('Discussion_first_message_title');
			expect(firstMessageField).toBeDisabled();
		});

		it('should disable encrypted toggle and first message field when an encrypted parent room is selected', async () => {
			const room1 = createFakeRoom({ encrypted: true, fname: 'Encrypted Room' });
			const room2 = createFakeRoom({ encrypted: false, fname: 'General' });

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
						// Just a mock
					} as any,
				}))
				.withEndpoint(
					'GET',
					'/v1/rooms.autocomplete.channelAndPrivate',
					() =>
						({
							items: [room1, room2],
							// Just a mock
						}) as any,
				)
				.build();

			render(<CreateDiscussion onClose={jest.fn()} />, { wrapper: appRoot });

			const parentRoomSelect = screen.getByRole('textbox', { name: 'Discussion_target_channel' });

			await userEvent.click(parentRoomSelect);

			await waitFor(() => {
				expect(screen.getByText('Encrypted Room')).toBeInTheDocument();
			});

			await userEvent.click(screen.getByText('Encrypted Room'));

			const encryptedToggle = screen.getByRole('checkbox', { name: 'Encrypted' });
			expect(encryptedToggle).toBeDisabled();

			const firstMessageField = screen.getByLabelText('Discussion_first_message_title');
			expect(firstMessageField).toBeDisabled();
		});
	});
});
