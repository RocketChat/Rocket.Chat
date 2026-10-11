import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConfirmOwnerChangeModal from './ConfirmOwnerChangeModal';
import type { ConfirmOwnerChangeModalProps } from './ConfirmOwnerChangeModal';

const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		Are_you_sure: 'Are you sure?',
		Cancel: 'Cancel',
		Close: 'Close',
		Ok: 'Ok',
		A_new_owner_will_be_assigned_automatically_to_the__roomName__room: 'New owner for <bold>{{roomName}}</bold>',
		A_new_owner_will_be_assigned_automatically_to_those__count__rooms__rooms__:
			'New owners for <bold>{{count}}</bold> rooms:<br/> {{rooms}}',
		A_new_owner_will_be_assigned_automatically_to__count__rooms: 'New owners for <bold>{{count}}</bold> rooms in total',
		The_empty_room__roomName__will_be_removed_automatically: 'Remove empty room <bold>{{roomName}}</bold>',
		__count__empty_rooms_will_be_removed_automatically__rooms__: 'Remove <bold>{{count}}</bold> empty rooms:<br/> {{rooms}}',
		__count__empty_rooms_will_be_removed_automatically: 'Remove {{count}} empty rooms in total',
	})
	.build();
const roomNames = ['general', 'engineering', 'support', 'design', 'announcements', 'random'];

const renderModal = (props: Partial<ConfirmOwnerChangeModalProps> = {}) => {
	const onConfirm = jest.fn();
	const onCancel = jest.fn();

	render(<ConfirmOwnerChangeModal shouldChangeOwner={[]} shouldBeRemoved={[]} onConfirm={onConfirm} onCancel={onCancel} {...props} />, {
		wrapper,
	});

	return { dialog: screen.getByRole('dialog', { name: 'Are you sure?' }), onConfirm, onCancel };
};

describe('owner-reassignment messages', () => {
	it('omits the owner-reassignment message when no rooms need a new owner', () => {
		const { dialog } = renderModal({ shouldBeRemoved: ['empty-room'] });

		expect(dialog).toHaveTextContent('Remove empty room empty-room');
		expect(dialog).not.toHaveTextContent('New owner');
	});

	it('names the room when exactly one room needs a new owner', () => {
		const { dialog } = renderModal({ shouldChangeOwner: ['general'] });

		expect(dialog).toHaveTextContent('New owner for general');
	});

	it.each([2, 3, 4, 5])('lists the count and joined names when %i rooms need a new owner', (count) => {
		const rooms = roomNames.slice(0, count);
		const { dialog } = renderModal({ shouldChangeOwner: rooms });

		expect(dialog).toHaveTextContent(`New owners for ${count} rooms: ${rooms.join(', ')}`);
	});

	it('shows only the count when more than five rooms need a new owner', () => {
		const { dialog } = renderModal({ shouldChangeOwner: roomNames });

		expect(dialog).toHaveTextContent('New owners for 6 rooms in total');
		for (const room of roomNames) {
			expect(dialog).not.toHaveTextContent(room);
		}
	});
});

describe('empty-room removal messages', () => {
	it('omits the room-removal message when no rooms will be removed', () => {
		const { dialog } = renderModal({ shouldChangeOwner: ['general'] });

		expect(dialog).toHaveTextContent('New owner for general');
		expect(dialog).not.toHaveTextContent('Remove');
	});

	it('names the room when exactly one empty room will be removed', () => {
		const { dialog } = renderModal({ shouldBeRemoved: ['general'] });

		expect(dialog).toHaveTextContent('Remove empty room general');
	});

	it.each([2, 3, 4, 5])('lists the count and joined names when %i empty rooms will be removed', (count) => {
		const rooms = roomNames.slice(0, count);
		const { dialog } = renderModal({ shouldBeRemoved: rooms });

		expect(dialog).toHaveTextContent(`Remove ${count} empty rooms: ${rooms.join(', ')}`);
	});

	it('shows only the count when more than five empty rooms will be removed', () => {
		const { dialog } = renderModal({ shouldBeRemoved: roomNames });

		expect(dialog).toHaveTextContent('Remove 6 empty rooms in total');
		for (const room of roomNames) {
			expect(dialog).not.toHaveTextContent(room);
		}
	});
});

describe('modal content and actions', () => {
	it('renders the optional content title with no room messages when both lists are empty', () => {
		const { dialog } = renderModal({ contentTitle: 'Delete this user and their data?' });

		expect(dialog).toHaveTextContent('Delete this user and their data?');
		expect(dialog).not.toHaveTextContent('New owner');
		expect(dialog).not.toHaveTextContent('Remove');
	});

	it('renders the content title and both messages with their respective rooms and counts', () => {
		const { dialog } = renderModal({
			contentTitle: 'Delete this user?',
			shouldChangeOwner: ['general', 'engineering'],
			shouldBeRemoved: ['support', 'design', 'random'],
		});

		expect(dialog).toHaveTextContent('Delete this user?');
		expect(dialog).toHaveTextContent('New owners for 2 rooms: general, engineering');
		expect(dialog).toHaveTextContent('Remove 3 empty rooms: support, design, random');
	});

	it('renders the configured confirmation text', () => {
		renderModal({ confirmText: 'Delete user' });

		expect(screen.getByRole('button', { name: 'Delete user' })).toBeInTheDocument();
	});

	it('invokes the confirmation callback when the confirm button is clicked', async () => {
		const user = userEvent.setup();
		const { onConfirm, onCancel } = renderModal({ confirmText: 'Delete user' });

		await user.click(screen.getByRole('button', { name: 'Delete user' }));

		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(onCancel).not.toHaveBeenCalled();
	});

	it.each(['Cancel', 'Close'])('invokes the cancellation callback when the %s button is clicked', async (name) => {
		const user = userEvent.setup();
		const { onConfirm, onCancel } = renderModal();

		await user.click(screen.getByRole('button', { name }));

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onConfirm).not.toHaveBeenCalled();
	});
});
