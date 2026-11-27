import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ConferenceLink } from './ConferenceLink';
import ConferenceLinkModalWithData from './ConferenceLinkModalWithData';
import type { ConferenceLinkModalWithDataProps } from './ConferenceLinkModalWithData';
import { videoConferenceQueryKeys } from '../../../../lib/queryKeys';

const weekly: ConferenceLink = { _id: 'weekly-id', title: 'Weekly sync', url: 'weekly-sync', ongoing: false };

const createdRoom = (title: string) => ({ room: { _id: 'new-id', title, url: 'new', rid: 'room-id' } }) as any;

const refusal = (error: string) => ({ success: false, error });

type Endpoint = jest.Mock;

const renderModal = (
	props: Partial<ConferenceLinkModalWithDataProps> = {},
	{ endpoint = jest.fn(async ({ title }) => createdRoom(title)) as Endpoint } = {},
) => {
	const onClose = jest.fn();
	const dispatchToast = jest.fn();
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

	render(<ConferenceLinkModalWithData {...({ mode: 'create', rid: 'room-id', onClose, ...props } as ConferenceLinkModalWithDataProps)} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withQueryClient(queryClient)
			.withToastMessageDispatch(dispatchToast)
			.withEndpoint('POST', '/v1/video-conference.rooms.create', endpoint)
			.withEndpoint('POST', '/v1/video-conference.rooms.rename', endpoint)
			.build(),
	});

	return { onClose, dispatchToast, invalidate, endpoint };
};

const input = () => screen.getByRole('textbox', { name: 'Conference_link_name' });

const confirm = (name: 'Create' | 'Rename') => userEvent.click(screen.getByRole('button', { name }));

const readsOfList = (invalidate: jest.SpyInstance) =>
	invalidate.mock.calls.filter(
		([filters]) => JSON.stringify(filters) === JSON.stringify({ queryKey: videoConferenceQueryKeys.persistentRooms('room-id') }),
	).length;

it('shows the modal in create mode', () => {
	renderModal();

	expect(screen.getByRole('dialog')).toHaveTextContent('Create_link');
	expect(input()).toHaveValue('');
});

it("shows the rename modal with the link's title", () => {
	renderModal({ mode: 'rename', link: weekly });

	expect(screen.getByRole('dialog')).toHaveTextContent('Rename_conference_link');
	expect(input()).toHaveValue('Weekly sync');
});

describe('create', () => {
	it('creates a link with the trimmed title', async () => {
		const { endpoint } = renderModal();

		await userEvent.type(input(), '  Weekly sync  ');
		await confirm('Create');

		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(1));
		expect(endpoint).toHaveBeenCalledWith({ roomId: 'room-id', title: 'Weekly sync' });
	});

	it('posts once however many times it is confirmed', async () => {
		const endpoint: Endpoint = jest.fn(() => new Promise(() => undefined));
		renderModal({}, { endpoint });

		await userEvent.type(input(), 'Weekly sync{enter}');
		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(1));
		await userEvent.type(input(), '{enter}');
		await userEvent.type(input(), '{enter}');

		expect(endpoint).toHaveBeenCalledTimes(1);
	});

	it('shows the confirm as loading while it runs', async () => {
		let resolve: (value: unknown) => void = () => undefined;
		const endpoint: Endpoint = jest.fn(
			() =>
				new Promise((r) => {
					resolve = r;
				}),
		);
		renderModal({}, { endpoint });

		await userEvent.type(input(), 'Weekly sync');
		await confirm('Create');

		await waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).toHaveClass('rcx-button--loading'));

		resolve(createdRoom('Weekly sync'));
	});

	it('tells the user, closes and reads the list again once it is created', async () => {
		const { dispatchToast, onClose, invalidate } = renderModal();

		await userEvent.type(input(), 'Weekly sync');
		await confirm('Create');

		await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
		expect(dispatchToast).toHaveBeenCalledWith({ type: 'success', message: 'Conference_link_created' });
		await waitFor(() => expect(readsOfList(invalidate)).toBe(1));
	});
});

describe('rename', () => {
	it('renames a link with the new title', async () => {
		const { endpoint } = renderModal({ mode: 'rename', link: weekly });

		await userEvent.clear(input());
		await userEvent.type(input(), 'Weekly planning ');
		await confirm('Rename');

		await waitFor(() => expect(endpoint).toHaveBeenCalledWith({ conferenceRoomId: 'weekly-id', title: 'Weekly planning' }));
	});

	it('posts nothing for a rename that only adds spaces', async () => {
		const { endpoint, dispatchToast } = renderModal({ mode: 'rename', link: weekly });

		await userEvent.type(input(), '   ');
		await confirm('Rename');

		await waitFor(() => expect(dispatchToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' })));
		expect(endpoint).not.toHaveBeenCalled();
	});

	it('tells the user, closes and reads the list again once it is renamed', async () => {
		const { dispatchToast, onClose, invalidate } = renderModal({ mode: 'rename', link: weekly });

		await userEvent.type(input(), ' planning');
		await confirm('Rename');

		await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
		expect(dispatchToast).toHaveBeenCalledWith({ type: 'success', message: 'Conference_link_renamed' });
		await waitFor(() => expect(readsOfList(invalidate)).toBe(1));
	});
});

describe('server errors', () => {
	it('shows the invalid title message in the modal and keeps what was typed', async () => {
		const endpoint: Endpoint = jest.fn(async () => {
			throw refusal('error-invalid-title');
		});
		const { onClose, invalidate } = renderModal({}, { endpoint });

		await userEvent.type(input(), '!!!');
		await confirm('Create');

		expect(await screen.findByRole('alert')).toHaveTextContent('error-invalid-title');
		expect(input()).toHaveValue('!!!');
		expect(onClose).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: 'Create' })).not.toHaveClass('rcx-button--loading');
		await waitFor(() => expect(readsOfList(invalidate)).toBe(1));
	});

	it.each(['error-not-allowed', 'error-invalid-conference-room', 'error-video-conf-links-not-supported'])(
		'shows the not-allowed and unknown-link messages the same way (%s)',
		async (code) => {
			const endpoint: Endpoint = jest.fn(async () => {
				throw refusal(code);
			});
			renderModal({ mode: 'rename', link: weekly }, { endpoint });

			await userEvent.type(input(), ' planning');
			await confirm('Rename');

			expect(await screen.findByRole('alert')).toHaveTextContent(code);
		},
	);

	it('shows an unexpected error generically', async () => {
		const endpoint: Endpoint = jest.fn(async () => {
			throw new Error('network down');
		});
		renderModal({}, { endpoint });

		await userEvent.type(input(), 'Weekly sync');
		await confirm('Create');

		expect(await screen.findByRole('alert')).toHaveTextContent('error-videoconf-unexpected');
	});

	it('clears the message when confirmed again', async () => {
		const endpoint: Endpoint = jest
			.fn()
			.mockRejectedValueOnce(refusal('error-invalid-title'))
			.mockImplementationOnce(() => new Promise(() => undefined));
		renderModal({}, { endpoint });

		await userEvent.type(input(), '!!!');
		await confirm('Create');
		expect(await screen.findByRole('alert')).toHaveTextContent('error-invalid-title');

		await userEvent.clear(input());
		await userEvent.type(input(), 'Weekly sync');
		await confirm('Create');

		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(2));
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('raises no toast for a refused create', async () => {
		const endpoint: Endpoint = jest.fn(async () => {
			throw refusal('error-invalid-title');
		});
		const { dispatchToast } = renderModal({}, { endpoint });

		await userEvent.type(input(), '!!!');
		await confirm('Create');

		expect(await screen.findByRole('alert')).toBeInTheDocument();
		expect(dispatchToast).not.toHaveBeenCalled();
	});

	it('announces a server error on the field', async () => {
		const endpoint: Endpoint = jest.fn(async () => {
			throw refusal('error-invalid-title');
		});
		renderModal({}, { endpoint });

		await userEvent.type(input(), '!!!');
		await confirm('Create');

		const alert = await screen.findByRole('alert');
		expect(input()).toHaveAttribute('aria-invalid', 'true');
		expect(input().getAttribute('aria-describedby')?.split(' ')).toContain(alert.id);
	});
});

describe('validation', () => {
	it('shows the required message for an empty title and posts nothing', async () => {
		const { endpoint } = renderModal();

		await confirm('Create');

		expect(await screen.findByRole('alert')).toHaveTextContent('Required_field');
		expect(endpoint).not.toHaveBeenCalled();
	});

	it('keeps the confirm button enabled while the title is empty', () => {
		renderModal();

		expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
	});
});
