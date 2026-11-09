import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PruneMessagesWithData from './PruneMessagesWithData';
import { createFakeRoom } from '../../../../../tests/mocks/data';

jest.mock('../../contexts/RoomContext', () => ({
	useRoom: () => createFakeRoom({ _id: 'room-id', t: 'c', fname: 'General' }),
}));

const cleanHistory = jest.fn();

const appRoot = () =>
	mockAppRoot()
		.withEndpoint('POST', '/v1/rooms.cleanHistory', cleanHistory)
		.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [{ _id: 'alice-id', username: 'alice', name: 'Alice' }] }) as any)
		.withTranslations('en', 'core', {
			Bulk_delete_summary_between:
				'{{items}} in {{roomName}} sent by {{users, list}}, from <bold>{{fromDate}}</bold> until <bold>{{toDate}}</bold> will be deleted.',
			Bulk_delete_excluding: 'Excluding {{types, list}} messages and files.',
			Bulk_delete_excluding_files: 'Excluding {{types, list}} files.',
			Bulk_delete_type_pinned: 'pinned',
			Bulk_delete_type_thread: 'thread',
			Bulk_delete_type_discussion: 'discussion',
			Bulk_delete_type_original_discussion: 'original discussion',
			Bulk_delete_all_users: 'all users',
			Messages_and_files: 'Messages and files',
		})
		.build();

const confirmModal = () => within(screen.getAllByRole('dialog').find((dialog) => within(dialog).queryByText('This_cannot_be_undone'))!);

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Delete_messages_and_files' }));

beforeEach(() => {
	cleanHistory.mockReset();
	cleanHistory.mockResolvedValue({ success: true, count: 1 });
});

it('deletes pinned, thread and discussion messages, with the messages discussions started from, when the defaults are kept', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	await submit();
	await userEvent.click(confirmModal().getByRole('button', { name: 'Delete_messages_and_files' }));

	await waitFor(() =>
		expect(cleanHistory).toHaveBeenCalledWith(
			expect.objectContaining({
				roomId: 'room-id',
				filesOnly: false,
				excludePinned: false,
				ignoreThreads: false,
				ignoreDiscussion: false,
				ignoreDiscussionOrigin: false,
				users: [],
			}),
		),
	);
});

it('keeps "Delete original discussion messages" checked and locked while discussion messages are deleted', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	const origin = screen.getByRole('checkbox', { name: 'RetentionPolicy_DeleteDiscussionOrigin' });
	expect(origin).toBeChecked();
	expect(origin).toBeDisabled();

	await userEvent.click(screen.getByRole('checkbox', { name: 'Delete_discussion_messages_and_files' }));

	expect(origin).toBeEnabled();
});

it('keeps discussion messages and the messages they started from when both are unchecked', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	await userEvent.click(screen.getByRole('checkbox', { name: 'Delete_discussion_messages_and_files' }));
	await userEvent.click(screen.getByRole('checkbox', { name: 'RetentionPolicy_DeleteDiscussionOrigin' }));
	await submit();
	await userEvent.click(confirmModal().getByRole('button', { name: 'Delete_messages_and_files' }));

	await waitFor(() =>
		expect(cleanHistory).toHaveBeenCalledWith(expect.objectContaining({ ignoreDiscussion: true, ignoreDiscussionOrigin: true })),
	);
});

it('names the room, the date range and what the delete excludes in the confirmation', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-10-01' } });
	fireEvent.change(screen.getByLabelText('Until Date'), { target: { value: '2026-10-31' } });
	await userEvent.click(screen.getByRole('checkbox', { name: 'Delete_pinned_messages_and_files' }));
	await userEvent.click(screen.getByRole('checkbox', { name: 'Delete_thread_messages_and_files' }));
	await userEvent.click(screen.getByRole('checkbox', { name: 'Delete_discussion_messages_and_files' }));
	await userEvent.click(screen.getByRole('checkbox', { name: 'RetentionPolicy_DeleteDiscussionOrigin' }));
	await submit();

	const modal = confirmModal();
	expect(modal.getByText(/^Messages and files in General sent by all users, from/)).toHaveTextContent(
		/from 10\/01\/2026 12:00 AM until 10\/31\/2026 11:59 PM will be deleted\.$/,
	);
	expect(modal.getByText('Excluding pinned, thread, discussion, and original discussion messages and files.')).toBeInTheDocument();
	expect(cleanHistory).not.toHaveBeenCalled();
});

it('drops the messages discussions started from out of the exclusions once discussion messages are deleted again', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	const discussions = screen.getByRole('checkbox', { name: 'Delete_discussion_messages_and_files' });
	const origin = screen.getByRole('checkbox', { name: 'RetentionPolicy_DeleteDiscussionOrigin' });
	await userEvent.click(discussions);
	await userEvent.click(origin);
	await userEvent.click(discussions);

	expect(origin).toBeChecked();

	fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-10-01' } });
	fireEvent.change(screen.getByLabelText('Until Date'), { target: { value: '2026-10-31' } });
	await userEvent.click(screen.getByRole('checkbox', { name: 'Delete_pinned_messages_and_files' }));
	await submit();

	expect(confirmModal().getByText('Excluding pinned messages and files.')).toBeInTheDocument();
});

it('only deletes what the selected users sent, and names them in the confirmation', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	await userEvent.type(screen.getByRole('combobox', { name: 'Only_delete_if_sent_by' }), 'ali');
	await userEvent.click(await screen.findByRole('option', { name: 'alice' }, { timeout: 3000 }));
	fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-10-01' } });
	fireEvent.change(screen.getByLabelText('Until Date'), { target: { value: '2026-10-31' } });
	await submit();

	const modal = confirmModal();
	expect(modal.getByText(/^Messages and files in General sent by alice, from/)).toBeInTheDocument();
	await userEvent.click(modal.getByRole('button', { name: 'Delete_messages_and_files' }));

	await waitFor(() => expect(cleanHistory).toHaveBeenCalledWith(expect.objectContaining({ users: ['alice'] })));
});

it('names only files in the exclusions when only files are deleted', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	await userEvent.click(screen.getByRole('combobox', { name: 'Delete' }));
	await userEvent.click(await screen.findByRole('option', { name: 'Only_files' }));
	fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-10-01' } });
	fireEvent.change(screen.getByLabelText('Until Date'), { target: { value: '2026-10-31' } });
	await userEvent.click(screen.getByRole('checkbox', { name: 'Delete_pinned_messages_and_files' }));
	await userEvent.click(screen.getByRole('button', { name: 'Delete_files' }));

	expect(confirmModal().getByText('Excluding pinned files.')).toBeInTheDocument();
	await userEvent.click(confirmModal().getByRole('button', { name: 'Delete_files' }));

	await waitFor(() => expect(cleanHistory).toHaveBeenCalledWith(expect.objectContaining({ filesOnly: true, excludePinned: true })));
});

it('deletes from the first to the last millisecond of the chosen days', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-10-01' } });
	fireEvent.change(screen.getByLabelText('Until Date'), { target: { value: '2026-10-31' } });
	await submit();
	await userEvent.click(confirmModal().getByRole('button', { name: 'Delete_messages_and_files' }));

	await waitFor(() =>
		expect(cleanHistory).toHaveBeenCalledWith(
			expect.objectContaining({ oldest: '2026-10-01T00:00:00.000Z', latest: '2026-10-31T23:59:59.999Z', inclusive: true }),
		),
	);
});

it('shows an error under Until and opens no confirmation when From is later than Until', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-11-07' } });
	fireEvent.change(screen.getByLabelText('Until Date'), { target: { value: '2026-11-01' } });
	await submit();

	expect(await screen.findByRole('alert')).toHaveTextContent('Newer_than_may_not_exceed_Older_than');
	expect(screen.getByLabelText('Until Date')).toBeInvalid();
	expect(screen.queryByText('This_cannot_be_undone')).not.toBeInTheDocument();
});

it('clears the date error once From is moved before Until', async () => {
	render(<PruneMessagesWithData />, { wrapper: appRoot() });

	fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-11-07' } });
	fireEvent.change(screen.getByLabelText('Until Date'), { target: { value: '2026-11-01' } });
	await submit();
	await screen.findByRole('alert');

	fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-10-01' } });

	await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
