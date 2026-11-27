import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ConferenceLink } from './ConferenceLink';
import DeleteConferenceLinkModalWithData from './DeleteConferenceLinkModalWithData';
import { videoConferenceQueryKeys } from '../../../../lib/queryKeys';

const weekly: ConferenceLink = { _id: 'weekly-id', title: 'Weekly sync', url: 'weekly-sync', ongoing: false };

type Endpoint = jest.Mock;

const renderModal = ({ endpoint = jest.fn(async () => ({}) as any) as Endpoint } = {}) => {
	const onClose = jest.fn();
	const dispatchToast = jest.fn();
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

	render(<DeleteConferenceLinkModalWithData rid='room-id' link={weekly} onClose={onClose} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withQueryClient(queryClient)
			.withToastMessageDispatch(dispatchToast)
			.withEndpoint('POST', '/v1/video-conference.rooms.delete', endpoint)
			.build(),
	});

	return { onClose, dispatchToast, invalidate, endpoint };
};

const confirm = () => userEvent.click(screen.getByRole('button', { name: 'Delete' }));

const readsOfList = (invalidate: jest.SpyInstance) =>
	invalidate.mock.calls.filter(
		([filters]) => JSON.stringify(filters) === JSON.stringify({ queryKey: videoConferenceQueryKeys.persistentRooms('room-id') }),
	).length;

it('deletes the link', async () => {
	const { endpoint } = renderModal();

	await confirm();

	await waitFor(() => expect(endpoint).toHaveBeenCalledWith({ conferenceRoomId: 'weekly-id' }));
});

it('posts once however many times it is confirmed', async () => {
	const endpoint: Endpoint = jest.fn(() => new Promise(() => undefined));
	renderModal({ endpoint });

	await confirm();
	await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(1));
	// The button is loading by now; it is clicked anyway, as an impatient user would.
	const user = userEvent.setup({ pointerEventsCheck: 0 });
	await user.click(screen.getByRole('button', { name: 'Delete' }));
	await user.click(screen.getByRole('button', { name: 'Delete' }));

	expect(endpoint).toHaveBeenCalledTimes(1);
});

it('tells the user, closes and reads the list again once it is deleted', async () => {
	const { onClose, dispatchToast, invalidate } = renderModal();

	await confirm();

	await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
	expect(dispatchToast).toHaveBeenCalledWith({ type: 'success', message: 'Conference_link_deleted' });
	await waitFor(() => expect(readsOfList(invalidate)).toBe(1));
});

it('tells the user why a delete failed, closes and reads the list again', async () => {
	const endpoint: Endpoint = jest.fn(() => Promise.reject({ success: false, error: 'error-invalid-conference-room' }));
	const { onClose, dispatchToast, invalidate } = renderModal({ endpoint });

	await confirm();

	await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
	expect(dispatchToast).toHaveBeenCalledWith({ type: 'error', message: 'error-invalid-conference-room' });
	expect(dispatchToast).toHaveBeenCalledTimes(1);
	await waitFor(() => expect(readsOfList(invalidate)).toBe(1));
});
