import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ConferenceWindow from './ConferenceWindow';
import { ConferenceContext } from '../context/ConferenceContext';
import { buildConferenceContext } from '../fixtures/storyFixtures';
import type { ConferenceFixture } from '../fixtures/storyFixtures';

const inACall: ConferenceFixture = {
	session: { joined: true, url: 'https://pexip.example/call', loading: false, embedded: false, retry: () => undefined },
	room: { rid: 'room1', loading: false, retry: () => undefined, unread: { count: 0, hasUnseenActivity: false } },
};

const renderInACall = (fixture: ConferenceFixture) => {
	const value = buildConferenceContext({ ...inACall, ...fixture, session: { ...inACall.session, ...fixture.session } });

	return render(
		<ConferenceContext.Provider value={value}>
			<ConferenceWindow />
		</ConferenceContext.Provider>,
		{ wrapper: mockAppRoot().build() },
	);
};

describe('ConferenceWindow', () => {
	it('should offer its own chat control by default', () => {
		renderInACall({});

		expect(screen.getByTitle('Chat')).toBeInTheDocument();
	});

	// The provider draws a chat button inside the call once the reader is connected; two would be one too many.
	it('should drop its chat control while the provider draws one', () => {
		renderInACall({ session: { providerOwnsChatToggle: true } as never });

		expect(screen.queryByTitle('Chat')).not.toBeInTheDocument();
	});

	// The members panel is this window's either way, so it is not the provider's to take over.
	it('should keep the members control whatever the provider draws', () => {
		renderInACall({ session: { providerOwnsChatToggle: true } as never });

		expect(screen.getByRole('button', { name: '__count__people_in_the_call' })).toBeInTheDocument();
	});

	describe('auto-join', () => {
		// The preflight exists to collect a camera and a microphone; a provider that can be told about neither
		// leaves it a single button between the reader and the call they opened.
		it('should join without asking, rather than showing the preflight', () => {
			const join = jest.fn();

			renderInACall({
				session: { joined: false, autoJoin: true } as never,
				actions: { join },
				slots: { loading: <span>waiting</span> },
			});

			expect(join).toHaveBeenCalledWith({ mic: true, cam: false }, expect.any(String), false);
			expect(screen.getByText('waiting')).toBeInTheDocument();
		});

		it('should not ask again while the first attempt is still in flight', () => {
			const join = jest.fn();

			renderInACall({
				session: { joined: false, autoJoin: true, loading: true } as never,
				actions: { join },
				slots: { loading: <span>waiting</span> },
			});

			expect(join).not.toHaveBeenCalled();
		});

		// A failed join has an answer of its own — the retry screen — and asking again in a loop is not it.
		it('should not ask again after a join failed', () => {
			const join = jest.fn();

			renderInACall({
				session: { joined: false, autoJoin: true, error: { kind: 'unreachable' } } as never,
				actions: { join },
			});

			expect(join).not.toHaveBeenCalled();
		});

		it('should show the preflight for a provider with devices to choose', () => {
			const join = jest.fn();

			renderInACall({ session: { joined: false } as never, actions: { join }, call: { capabilities: { mic: true, cam: true } } });

			expect(join).not.toHaveBeenCalled();
		});
	});
});
