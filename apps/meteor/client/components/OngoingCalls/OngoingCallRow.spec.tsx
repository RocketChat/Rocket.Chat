import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OngoingCallRow from './OngoingCallRow';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const onJoin = jest.fn();
const onDecline = jest.fn();

const renderRow = (name = 'Standup') =>
	render(<OngoingCallRow call={buildJoinableCall({ callId: 'call-1', name })} onJoin={onJoin} onDecline={onDecline} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withUserPreference('displayAvatars', true)
			// The row's claim is *how many* people are in the call, and the raw key carries no count at all.
			.withTranslations('en', 'core', {
				__count__people_joined_one: '{{count}} person joined',
				__count__people_joined_other: '{{count}} people joined',
			})
			.build(),
	});

beforeEach(() => {
	onJoin.mockClear();
	onDecline.mockClear();
});

it('says what the call is and how many people are in it', () => {
	renderRow('Sprint planning');

	expect(screen.getByText('Sprint planning')).toBeInTheDocument();
	// `buildJoinableCall` puts two people in it.
	expect(screen.getByText('2 people joined')).toBeInTheDocument();
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
