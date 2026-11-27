import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VideoCallMenuWithData from './VideoCallMenuWithData';
import type { VideoCallMenuWithDataProps } from './VideoCallMenuWithData';

jest.mock('../../contextualBar/VideoConference/hooks/useVideoConfOpenCall', () => ({
	useVideoConfOpenCall: () => jest.fn(),
}));

type Row = { _id: string; title: string; url: string; ongoingCallId?: string };

const weekly: Row = { _id: 'weekly-id', title: 'Weekly sync', url: 'weekly-sync' };
const standup: Row = { _id: 'standup-id', title: 'Daily standup', url: 'daily-standup', ongoingCallId: 'call-1' };

const asRoom = (row: Row) => ({
	...row,
	rid: 'room-id',
	providerName: 'livekit',
	createdAt: '2026-11-25T10:00:00.000Z',
	_updatedAt: '2026-11-25T10:00:00.000Z',
	createdBy: { _id: 'creator', username: 'creator', name: 'Creator' },
});

const renderMenu = (props: Partial<VideoCallMenuWithDataProps> = {}, { rows = [weekly, standup] }: { rows?: Row[] } = {}) => {
	let current = rows;
	const list = jest.fn(async () => ({ rooms: current.map(asRoom) }) as any);
	const create = jest.fn(async ({ title }: { title: string }) => {
		const row = { _id: 'retro-id', title, url: 'retro' };
		current = [...current, row];
		return { room: asRoom(row) } as any;
	});
	const rename = jest.fn(async ({ conferenceRoomId, title }: { conferenceRoomId: string; title: string }) => {
		current = current.map((row) => (row._id === conferenceRoomId ? { ...row, title } : row));
		return { room: asRoom(current.find((row) => row._id === conferenceRoomId) as Row) } as any;
	});
	const remove = jest.fn(async ({ conferenceRoomId }: { conferenceRoomId: string }) => {
		current = current.filter((row) => row._id !== conferenceRoomId);
		return {} as any;
	});
	const onStart = jest.fn();

	render(
		<VideoCallMenuWithData
			rid='room-id'
			title='Video_call'
			icon='video'
			canStart
			canManage
			startDisabled={false}
			onStart={onStart}
			{...props}
		/>,
		{
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withTranslations('en', 'core', { Conference_link_ongoing: '{{title}}, ongoing' })
				.withEndpoint('GET', '/v1/video-conference.rooms.list', list)
				.withEndpoint('POST', '/v1/video-conference.rooms.create', create)
				.withEndpoint('POST', '/v1/video-conference.rooms.rename', rename)
				.withEndpoint('POST', '/v1/video-conference.rooms.delete', remove)
				.build(),
		},
	);

	return { list, create, rename, remove, onStart };
};

const openMenu = async () => {
	// A member's button has nothing to offer until the links arrive.
	await waitFor(() => expect(screen.getByRole('button', { name: 'Video_call' })).toBeEnabled());
	await userEvent.click(screen.getByRole('button', { name: 'Video_call' }));
	return screen.findByRole('menu');
};

const openLink = async (name: string) => {
	await userEvent.click(await screen.findByRole('menuitem', { name }));
	return screen.findAllByRole('menu').then((menus) => menus[menus.length - 1]);
};

const subMenuActions = (menu: HTMLElement) =>
	within(menu)
		.getAllByRole('menuitem')
		.map((item) => item.getAttribute('data-key')?.split('-').pop());

it('lists the links of the room under Conference_links', async () => {
	const { list } = renderMenu();
	await waitFor(() => expect(list).toHaveBeenCalled());
	await openMenu();

	const links = await screen.findByRole('group', { name: 'Conference_links' });
	expect(
		within(links)
			.getAllByRole('menuitem')
			.map((item) => item.getAttribute('data-key')),
	).toEqual(['link-weekly-id', 'link-standup-id']);
});

it('marks the link that is ongoing and names it as ongoing', async () => {
	renderMenu();
	await openMenu();

	const row = await screen.findByRole('menuitem', { name: 'Daily standup, ongoing' });
	expect(within(row).getByText('Ongoing')).toBeInTheDocument();
	expect(screen.getByRole('menuitem', { name: 'Weekly sync' })).toBeInTheDocument();
});

it('shows no links section for a room without links', async () => {
	const { list } = renderMenu({}, { rows: [] });
	await waitFor(() => expect(list).toHaveBeenCalled());
	await openMenu();

	expect(screen.queryByRole('group', { name: 'Conference_links' })).not.toBeInTheDocument();
	expect(screen.getByRole('menuitem', { name: 'Start_conference' })).toBeInTheDocument();
});

it('is disabled for a member without call-management in a room without links', async () => {
	const { list } = renderMenu({ canStart: false, canManage: false }, { rows: [] });
	await waitFor(() => expect(list).toHaveBeenCalled());

	expect(screen.getByRole('button', { name: 'Video_call' })).toBeDisabled();
});

it('reads the list when it mounts and not before', async () => {
	const { list } = renderMenu();

	await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
	expect(list).toHaveBeenCalledWith({ roomId: 'room-id' });
});

it.each([
	['Weekly sync', ['open', 'copy']],
	['Daily standup, ongoing', ['join', 'copy']],
])('offers a member only the links, with Open or Join call and Copy link (%s)', async (row, actions) => {
	renderMenu({ canStart: false, canManage: false });
	const menu = await openMenu();

	expect(within(menu).queryByRole('menuitem', { name: 'Start_conference' })).not.toBeInTheDocument();
	expect(within(menu).queryByRole('menuitem', { name: 'Create_link' })).not.toBeInTheDocument();
	expect(subMenuActions(await openLink(row))).toEqual(actions);
});

it.each([
	['Weekly sync', ['open', 'copy', 'rename', 'delete']],
	['Daily standup, ongoing', ['join', 'copy', 'rename', 'delete']],
])('offers a manager Start conference, Create link and every link action (%s)', async (row, actions) => {
	renderMenu();
	const menu = await openMenu();

	expect(within(menu).getByRole('menuitem', { name: 'Start_conference' })).toBeInTheDocument();
	expect(within(menu).getByRole('menuitem', { name: 'Create_link' })).toBeInTheDocument();
	expect(subMenuActions(await openLink(row))).toEqual(actions);
});

it('disables Start conference and Create link while starting is refused, with the reason', async () => {
	renderMenu({ startDisabled: true, startDisabledReason: 'Join_the_room_to_start_a_call' });

	expect(screen.getByRole('button', { name: 'Video_call' })).toBeEnabled();
	await openMenu();

	for (const name of ['Start_conference', 'Create_link']) {
		const item = screen.getByRole('menuitem', { name });
		expect(item).toHaveAttribute('aria-disabled', 'true');
		expect(within(item).getByTitle('Join_the_room_to_start_a_call')).toBeInTheDocument();
	}
});

it('keeps the link actions usable while starting is refused', async () => {
	renderMenu({ startDisabled: true });
	await openMenu();

	const sub = await openLink('Weekly sync');

	within(sub)
		.getAllByRole('menuitem')
		.forEach((item) => expect(item).not.toHaveAttribute('aria-disabled', 'true'));
});

describe('from the menu', () => {
	it('creates a link from the menu and shows it', async () => {
		const { create, list } = renderMenu();
		await openMenu();

		await userEvent.click(screen.getByRole('menuitem', { name: 'Create_link' }));
		await userEvent.type(await screen.findByRole('textbox', { name: 'Conference_link_name' }), 'Retro');
		await userEvent.click(screen.getByRole('button', { name: 'Create' }));

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(create).toHaveBeenCalledWith({ roomId: 'room-id', title: 'Retro' });
		await waitFor(() => expect(list).toHaveBeenCalledTimes(2));

		await openMenu();
		expect(await screen.findByRole('menuitem', { name: 'Retro' })).toBeInTheDocument();
	});

	it('renames a link from its sub menu', async () => {
		const { rename, list } = renderMenu();
		await openMenu();

		await userEvent.click(within(await openLink('Weekly sync')).getByRole('menuitem', { name: 'Rename' }));
		const input = await screen.findByRole('textbox', { name: 'Conference_link_name' });
		await userEvent.clear(input);
		await userEvent.type(input, 'Weekly planning');
		await userEvent.click(screen.getByRole('button', { name: 'Rename' }));

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(rename).toHaveBeenCalledWith({ conferenceRoomId: 'weekly-id', title: 'Weekly planning' });
		await waitFor(() => expect(list).toHaveBeenCalledTimes(2));

		await openMenu();
		expect(await screen.findByRole('menuitem', { name: 'Weekly planning' })).toBeInTheDocument();
	});

	it('deletes a link from its sub menu', async () => {
		const { remove, list } = renderMenu();
		await openMenu();

		await userEvent.click(within(await openLink('Weekly sync')).getByRole('menuitem', { name: 'Delete' }));
		await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(remove).toHaveBeenCalledWith({ conferenceRoomId: 'weekly-id' });
		await waitFor(() => expect(list).toHaveBeenCalledTimes(2));

		await openMenu();
		expect(await screen.findByRole('menuitem', { name: 'Daily standup, ongoing' })).toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Weekly sync' })).not.toBeInTheDocument();
	});
});
