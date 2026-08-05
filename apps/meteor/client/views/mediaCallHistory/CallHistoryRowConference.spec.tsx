import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CallHistoryRowConference from './CallHistoryRowConference';

const onJoin = jest.fn();
const goToRoom = jest.fn();

jest.mock('../room/hooks/useGoToRoom', () => ({
	useGoToRoom: () => goToRoom,
}));

const renderRow = (props: Partial<Parameters<typeof CallHistoryRowConference>[0]> = {}) =>
	render(
		<table>
			<tbody>
				<CallHistoryRowConference
					_id='item-id'
					rid='room-id'
					title='Sprint planning'
					usersCount={2}
					type='inbound'
					status='ended'
					timestamp={new Date('2026-08-04T10:00:00.000Z').toISOString()}
					{...props}
				/>
			</tbody>
		</table>,
		{ wrapper: mockAppRoot().withJohnDoe().build() },
	);

beforeEach(() => {
	onJoin.mockClear();
	goToRoom.mockClear();
});

it('shows what the call was and who was in it', async () => {
	renderRow();

	expect(await screen.findByText('Sprint planning')).toBeInTheDocument();
	expect(screen.getByText('__usersCount__participants')).toBeInTheDocument();
	expect(screen.getByText('Ended')).toBeInTheDocument();
});

// A call still running is a row of this same list — the history is the one list of calls, and its state is what
// tells it apart from the ones that finished.
describe('a call that is still running', () => {
	it('reads as ongoing', async () => {
		renderRow({ status: 'ongoing' });

		expect(await screen.findByText('Ongoing')).toBeInTheDocument();
	});

	it('offers a way in', async () => {
		renderRow({ status: 'ongoing', onJoin });

		await userEvent.click(await screen.findByRole('button', { name: 'Join' }));

		expect(onJoin).toHaveBeenCalled();
	});

	// The row itself opens the call's room, so joining has to stop there — one row, two destinations.
	it('does not open the room on the way into the call', async () => {
		renderRow({ status: 'ongoing', onJoin });

		await userEvent.click(await screen.findByRole('button', { name: 'Join' }));

		expect(goToRoom).not.toHaveBeenCalled();
	});
});

it('offers no way into a call that already finished', async () => {
	renderRow();

	expect(await screen.findByText('Ended')).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Join' })).not.toBeInTheDocument();
});
