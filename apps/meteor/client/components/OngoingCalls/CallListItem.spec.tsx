import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CallListItem from './CallListItem';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const onJoin = jest.fn();
const onDecline = jest.fn();
const onSilence = jest.fn();

let incomingCalls: { callId: string; dismissed: boolean }[] = [];

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfIncomingCalls: () => incomingCalls,
}));

const renderItem = (call: Parameters<typeof CallListItem>[0]['call'], { silenced = false } = {}) =>
	render(<CallListItem call={call} silenced={silenced} onJoin={onJoin} onDecline={onDecline} onSilence={onSilence} />, {
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

const ongoingCall = (name = 'Standup') => buildJoinableCall({ callId: 'call-1', name });
const ringingCall = () => buildJoinableCall({ callId: 'ringing', name: 'Alice', ringingAt: new Date() });

beforeEach(() => {
	onJoin.mockClear();
	onDecline.mockClear();
	onSilence.mockClear();
	incomingCalls = [{ callId: 'ringing', dismissed: false }];
});

describe('any call in the list', () => {
	it('says what the call is and how many people are in it', () => {
		renderItem(ongoingCall('Sprint planning'));

		expect(screen.getByText('Sprint planning')).toBeInTheDocument();
		// `buildJoinableCall` puts two people in it.
		expect(screen.getByText('2 people joined')).toBeInTheDocument();
	});

	it('is the room item with no avatar', () => {
		const { container } = renderItem(ongoingCall());

		expect(container.querySelector('.rcx-sidebar-item')).not.toBeNull();
		expect(container.querySelector('.rcx-sidebar-item__timestamp')).not.toBeNull();
		expect(container.querySelector('.rcx-sidebar-item__avatar')).toBeNull();
	});

	it('opens the call when the row is clicked', async () => {
		const { container } = renderItem(ongoingCall());
		const row = container.querySelector('.rcx-sidebar-item') as HTMLElement;

		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		row.dispatchEvent(click);

		expect(click.defaultPrevented).toBe(true);
		expect(onJoin).toHaveBeenCalledWith('call-1');
		expect(onDecline).not.toHaveBeenCalled();
	});
});

describe('a call that is merely running', () => {
	it('turns the call down without opening it', async () => {
		renderItem(ongoingCall());

		await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

		expect(onDecline).toHaveBeenCalledWith('call-1');
		expect(onJoin).not.toHaveBeenCalled();
	});

	it('says nothing about ringing, and offers nothing to silence', () => {
		renderItem(ongoingCall());

		expect(screen.queryByText(/Ringing/)).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
	});

	// There is nothing left to decline, so the button's place says what happened instead.
	it('shows that a declined call was declined, with no button', () => {
		renderItem(buildJoinableCall({ callId: 'refused', name: 'Design review', declined: true }));

		expect(screen.getByText('(Declined)')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
	});

	// Leaving a call is not something a list row does.
	it('offers no decline for a call this user is already in', () => {
		renderItem(buildJoinableCall({ callId: 'joined', name: 'Pairing session', joined: true }));

		expect(screen.queryByRole('button', { name: 'Decline' })).not.toBeInTheDocument();
		expect(screen.queryByText('(Declined)')).not.toBeInTheDocument();
	});
});

describe('a call that is ringing', () => {
	it('accepts when the row is clicked', async () => {
		renderItem(ringingCall());

		await userEvent.click(screen.getByText('Alice'));

		expect(onJoin).toHaveBeenCalledWith('ringing');
	});

	it('says it is ringing where the time would be', () => {
		renderItem(ringingCall());

		expect(screen.getByText(/Ringing/)).toBeInTheDocument();
	});

	it('offers both silence and decline while it is still sounding', async () => {
		renderItem(ringingCall());

		expect(screen.getByRole('button', { name: 'Silence' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Silence' }));

		expect(onSilence).toHaveBeenCalledWith('ringing');
		expect(onJoin).not.toHaveBeenCalled();
		expect(onDecline).not.toHaveBeenCalled();
	});

	it('keeps both buttons at the end of the row', () => {
		const { container } = renderItem(ringingCall());
		const buttons = [...container.querySelectorAll('button')].map((button) => button.getAttribute('aria-label'));

		expect(buttons).toEqual(['Silence', 'Decline']);
	});

	it('replaces silence with a silenced icon once muted, keeping decline', async () => {
		renderItem(ringingCall(), { silenced: true });

		expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
		expect(screen.getByTitle('Incoming_call_silenced')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

		expect(onDecline).toHaveBeenCalledWith('ringing');
	});

	// A ring can be sounding on another of this user's sessions: there is nothing to silence here.
	it('offers the decline straight away for a ring it never heard', () => {
		incomingCalls = [];

		renderItem(ringingCall());

		expect(screen.queryByRole('button', { name: 'Silence' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
	});
});
