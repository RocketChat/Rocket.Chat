import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ArchiveRoomsModal from './ArchiveRoomsModal';

jest.mock('../../lib/RoomManager', () => ({
	useOpenedRoom: () => 'open-room',
}));

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);

const room = (overrides: Partial<SubscriptionWithRoom> & { rid: string; t: string }) =>
	({ _id: overrides.rid, name: overrides.rid, u: { _id: 'me' }, unread: 0, alert: false, ...overrides }) as SubscriptionWithRoom;

const rooms = [
	room({ rid: 'quiet-channel', t: 'c', lm: daysAgo(100) }),
	room({ rid: 'recent-channel', t: 'c', lm: daysAgo(2) }),
	room({ rid: 'quiet-unread', t: 'c', lm: daysAgo(100), unread: 3, alert: true }),
	room({ rid: 'open-room', t: 'c', lm: daysAgo(100) }),
	room({ rid: 'old-dm', t: 'd', lm: daysAgo(400) }),
	room({ rid: 'quiet-group', t: 'p', lm: daysAgo(50) }),
	room({ rid: 'undated', t: 'c' }),
];

// PREVIEW ONLY: the archived rooms live in localStorage here, see useArchivedRooms.
const ARCHIVED_KEY = 'fuselage-localStorage-sidebarArchivedRooms-anonymous';
const archivedRoomIds = () => JSON.parse(localStorage.getItem(ARCHIVED_KEY) ?? '[]');

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Archive: 'Archive',
		Archive_rooms_in__group__: 'Archive rooms in {{group}}',
		Inactive_for: 'Inactive for',
		Inactive_since: 'Inactive since',
		Custom_date: 'Custom date',
		Choose_today_or_an_earlier_date: 'Choose today or an earlier date.',
		Include_unread_rooms: 'Include unread rooms',
		No_rooms_to_archive: 'No rooms to archive',
		Rooms_to_archive_one: '{{count}} room to archive',
		Rooms_to_archive_other: '{{count}} rooms to archive',
		Rooms_archived_one: '{{count}} room archived',
		Rooms_archived_other: '{{count}} rooms archived',
		Archived_rooms_stay_until_unarchived: 'Archived rooms stay archived until you unarchive them.',
		Cancel: 'Cancel',
	})
	.build();

beforeEach(() => {
	localStorage.clear();
});

const renderModal = (onClose = jest.fn()) => {
	render(<ArchiveRoomsModal groupTitle='Channels' rooms={rooms} onClose={onClose} />, { wrapper: appRoot });
	return onClose;
};

const pickPreset = async (label: string) => {
	await userEvent.click(screen.getByRole('combobox'));
	await userEvent.click(await screen.findByRole('option', { name: label }));
};

describe('archiving the inactive rooms', () => {
	it('counts the read rooms quiet for the default 30 days, leaving the open one and the undated ones', () => {
		renderModal();

		expect(screen.getByRole('dialog', { name: 'Archive rooms in Channels' })).toBeInTheDocument();
		expect(screen.getByRole('combobox', { name: 'Inactive for' })).toHaveTextContent('30 days');
		expect(screen.getByRole('status')).toHaveTextContent('3 rooms to archive');
	});

	it('archives them, keeping any archived before, and closes', async () => {
		localStorage.setItem(ARCHIVED_KEY, JSON.stringify(['earlier']));
		const onClose = renderModal();

		await userEvent.click(screen.getByRole('button', { name: 'Archive' }));

		await waitFor(() => expect(onClose).toHaveBeenCalled());
		expect(archivedRoomIds()).toEqual(['earlier', 'quiet-channel', 'old-dm', 'quiet-group']);
	});

	it('takes the unread rooms too only when asked', async () => {
		renderModal();

		await userEvent.click(screen.getByRole('checkbox', { name: 'Include unread rooms' }));

		expect(screen.getByRole('status')).toHaveTextContent('4 rooms to archive');
	});

	it('offers a year, counted in years', async () => {
		renderModal();

		await pickPreset('1 year');

		expect(screen.getByRole('status')).toHaveTextContent('1 room to archive');
	});

	it('takes any past date, and has nothing to archive before the oldest room', async () => {
		renderModal();

		await pickPreset('Custom date');
		const field = screen.getByLabelText('Inactive since');
		expect(field).toHaveFocus();
		expect(screen.getByRole('status')).toHaveTextContent('No rooms to archive');
		expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
		expect(await axe(screen.getByRole('dialog'))).toHaveNoViolations();

		fireEvent.change(field, { target: { value: '2020-01-01' } });
		expect(screen.getByRole('status')).toHaveTextContent('No rooms to archive');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(field).not.toHaveAttribute('aria-invalid', 'true');
	});

	it('refuses a day still to come, saying so on the field', async () => {
		renderModal();

		await pickPreset('Custom date');
		const field = screen.getByLabelText('Inactive since');
		fireEvent.change(field, { target: { value: '2099-01-01' } });

		expect(screen.getByRole('alert')).toHaveTextContent('Choose today or an earlier date.');
		expect(field).toHaveAttribute('aria-invalid', 'true');
		expect(field).toHaveAccessibleDescription('Choose today or an earlier date.');
		expect(screen.getByRole('status')).toHaveTextContent('No rooms to archive');
		expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();

		fireEvent.change(field, { target: { value: '2020-01-01' } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
