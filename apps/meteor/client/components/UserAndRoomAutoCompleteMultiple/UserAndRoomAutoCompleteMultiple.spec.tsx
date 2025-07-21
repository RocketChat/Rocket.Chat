import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UserAndRoomAutoCompleteMultiple from './UserAndRoomAutoCompleteMultiple';
import { createFakeSubscription, createFakeUser } from '../../../tests/mocks/data';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

const user = createFakeUser({
	active: true,
	roles: ['admin'],
	type: 'user',
});

const direct = createFakeSubscription({
	t: 'd',
	name: 'Direct',
});

const channel = createFakeSubscription({
	t: 'c',
	name: 'General',
});

const appRoot = new MockedAppRootBuilder()
	.withSubscriptions([
		{ ...direct, ro: false },
		{ ...channel, ro: true },
	] as unknown as SubscriptionWithRoom[])
	.withUser(user);

jest.mock('../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		readOnly: jest.fn(),
	},
}));

beforeEach(() => {
	(roomCoordinator.readOnly as jest.Mock).mockReturnValue(false);
});

afterEach(() => jest.clearAllMocks());

it('should render options based on user subscriptions', async () => {
	render(<UserAndRoomAutoCompleteMultiple value={[]} onChange={jest.fn()} />, { wrapper: appRoot.build() });

	const input = screen.getByRole('textbox');
	await userEvent.click(input);

	await waitFor(() => {
		expect(screen.getByText('Direct')).toBeInTheDocument();
	});

	await waitFor(() => {
		expect(screen.getByText('General')).toBeInTheDocument();
	});
});

it('should filter out read-only rooms', async () => {
	(roomCoordinator.readOnly as jest.Mock).mockReturnValueOnce(true);

	render(<UserAndRoomAutoCompleteMultiple value={[]} onChange={jest.fn()} />, { wrapper: appRoot.build() });

	const input = screen.getByRole('textbox');
	await userEvent.click(input);

	await waitFor(() => {
		expect(screen.getByText('General')).toBeInTheDocument();
	});

	await waitFor(() => {
		expect(screen.queryByText('Direct')).not.toBeInTheDocument();
	});
});

it('should call onChange when selecting an option', async () => {
	const handleChange = jest.fn();
	render(<UserAndRoomAutoCompleteMultiple value={[]} onChange={handleChange} />, { wrapper: appRoot.build() });

	const input = screen.getByRole('textbox');
	await userEvent.click(input);

	await waitFor(() => {
		expect(screen.getByText('General')).toBeInTheDocument();
	});

	await userEvent.click(screen.getByText('General'));
	expect(handleChange).toHaveBeenCalled();
});
