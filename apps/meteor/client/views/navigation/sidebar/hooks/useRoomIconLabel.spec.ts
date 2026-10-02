import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useRoomIconLabel } from './useRoomIconLabel';
import { createFakeSubscription } from '../../../../../tests/mocks/data';

const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		Incoming_call: 'Incoming call',
		Omnichannel: 'Omnichannel',
		Discussion: 'Discussion',
		Team: 'Team',
		Private_Team: 'Private team',
		Direct_message: 'Direct message',
		Private_Channel: 'Private channel',
		Public_Channel: 'Public channel',
	})
	.build();

it.each([
	['public channel', createFakeSubscription({ t: 'c', prid: undefined, teamMain: false }), 'Public channel'],
	['private channel', createFakeSubscription({ t: 'p', prid: undefined, teamMain: false }), 'Private channel'],
	['discussion', createFakeSubscription({ t: 'p', prid: 'parent', teamMain: false }), 'Discussion'],
	['public team', createFakeSubscription({ t: 'c', prid: undefined, teamMain: true }), 'Team'],
	['private team', createFakeSubscription({ t: 'p', prid: undefined, teamMain: true }), 'Private team'],
	['omnichannel room', createFakeSubscription({ t: 'l', prid: undefined, teamMain: false }), 'Omnichannel'],
	['group direct message', createFakeSubscription({ t: 'd', uids: ['a', 'b', 'c'], prid: undefined, teamMain: false }), 'Direct message'],
])('labels a %s', (_name, room, label) => {
	const { result } = renderHook(() => useRoomIconLabel({ ...room, federated: false, abacAttributes: undefined }), { wrapper });

	expect(result.current).toBe(label);
});

it('labels a ringing room as an incoming call', () => {
	const room = createFakeSubscription({ t: 'c' });
	const { result } = renderHook(() => useRoomIconLabel(room, true), { wrapper });

	expect(result.current).toBe('Incoming call');
});
