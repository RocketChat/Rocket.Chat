import type { ConferenceMember, PluginFeature, ProviderPluginControls } from '@rocket.chat/ui-conference';
import { renderHook } from '@testing-library/react';

import { useLobbyRefresh } from './useLobbyRefresh';

const refreshRoster = jest.fn();

const actions = { refreshRoster } as unknown as ProviderPluginControls['actions'];

const member = (_id: string, connections: NonNullable<ConferenceMember['providerParticipants']>): ConferenceMember => ({
	_id,
	username: _id,
	name: _id,
	providerParticipants: connections,
});

const waitingAda = member('ada', [{ id: 'p-ada', connectedAt: new Date(0), waiting: true }]);
const admittedAda = member('ada', [{ id: 'p-ada', connectedAt: new Date(0) }]);
const rejectedAda = member('ada', [{ id: 'p-ada', connectedAt: new Date(0), waiting: true, leftAt: new Date(1) }]);
const grace = member('grace', [{ id: 'p-grace', connectedAt: new Date(0) }]);

const render = (members: ConferenceMember[], { canControl = true, features = ['refresh-roster'] as PluginFeature[] } = {}) =>
	renderHook(
		({ members, canControl }: { members: ConferenceMember[]; canControl: boolean }) =>
			useLobbyRefresh(members, {
				features: new Set(features),
				self: { participantUuid: 'me', micMuted: false, camMuted: false, clientMuted: false, isHost: canControl, canControl },
				participants: [],
				actions,
			}),
		{ initialProps: { members, canControl } },
	);

beforeEach(() => jest.clearAllMocks());

describe('useLobbyRefresh', () => {
	it.each([
		['somebody arrives in the lobby', [grace], [grace, waitingAda]],
		['somebody is let in', [waitingAda], [admittedAda]],
		['somebody is turned away or gives up', [waitingAda], [rejectedAda]],
	])('asks for the call again when %s', (_, before, after) => {
		const { rerender } = render(before);
		refreshRoster.mockClear();

		rerender({ members: after, canControl: true });

		expect(refreshRoster).toHaveBeenCalledTimes(1);
	});

	// The server reports far more than the lobby — every connection and departure — and none of it is a reason to ask.
	it('does not ask again for a change that leaves the lobby as it was', () => {
		const { rerender } = render([waitingAda]);
		refreshRoster.mockClear();

		rerender({ members: [waitingAda, grace], canControl: true });

		expect(refreshRoster).not.toHaveBeenCalled();
	});

	// A guest is not told about the lobby, so a new host has never heard of anybody already waiting in it.
	it('asks when the viewer becomes somebody who can let people in', () => {
		const { rerender } = render([waitingAda], { canControl: false });
		expect(refreshRoster).not.toHaveBeenCalled();

		rerender({ members: [waitingAda], canControl: true });

		expect(refreshRoster).toHaveBeenCalledTimes(1);
	});

	it('asks nothing of a plugin that cannot answer', () => {
		const { rerender } = render([waitingAda], { features: [] });

		rerender({ members: [rejectedAda], canControl: true });

		expect(refreshRoster).not.toHaveBeenCalled();
	});
});
