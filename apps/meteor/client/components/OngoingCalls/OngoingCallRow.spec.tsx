import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OngoingCallRow from './OngoingCallRow';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const onJoin = jest.fn();
const onDecline = jest.fn();

const renderRow = (name = 'Standup') =>
	render(<OngoingCallRow call={buildJoinableCall({ callId: 'call-1', name })} onJoin={onJoin} onDecline={onDecline} />, {
		wrapper: mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true).build(),
	});

beforeEach(() => {
	onJoin.mockClear();
	onDecline.mockClear();
});

it('says what the call is and how many people are in it', () => {
	renderRow('Sprint planning');

	expect(screen.getByText('Sprint planning')).toBeInTheDocument();
	expect(screen.getByText('__count__people_joined')).toBeInTheDocument();
});

it('opens the call when the row is clicked', async () => {
	const { container } = renderRow();
	const row = container.querySelector('.rcx-sidebar-v2-item') as HTMLElement;

	const click = new MouseEvent('click', { bubbles: true, cancelable: true });
	row.dispatchEvent(click);

	expect(click.defaultPrevented).toBe(true);
	expect(onJoin).toHaveBeenCalledWith('call-1');
	expect(onDecline).not.toHaveBeenCalled();
});

it('turns the call down without opening it', async () => {
	renderRow();

	await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

	expect(onDecline).toHaveBeenCalledWith('call-1');
	expect(onJoin).not.toHaveBeenCalled();
});

it('is the room item with no avatar', () => {
	const { container } = renderRow('Standup');

	expect(container.querySelector('.rcx-sidebar-v2-item')).not.toBeNull();
	expect(container.querySelector('.rcx-sidebar-v2-item__timestamp')).not.toBeNull();
	expect(container.querySelector('.rcx-sidebar-v2-item__avatar')).toBeNull();
});
