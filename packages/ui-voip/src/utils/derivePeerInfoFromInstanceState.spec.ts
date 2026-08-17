import type { IDirectMediaCallData, ITempMediaCallData } from '@rocket.chat/media-signaling';

import { derivePeerInfoFromInstanceState } from './derivePeerInfoFromInstanceState';

describe('derivePeerInfoFromInstanceState', () => {
	const localParticipant = {
		local: true,
		participantId: 'participantId',
		actorType: 'user',
		actorId: 'userId',
		role: 'caller',
		muted: false,
		held: false,
		contact: {
			displayName: 'User Display Name',
		},
		getMediaStream: () => null,
		setMuted: () => null,
		setHeld: () => null,
	} as const;

	describe('Temp Call', () => {
		it('returns internal peer info with title from instance state', () => {
			const state: ITempMediaCallData = {
				confirmed: false,
				tempCallId: 'tempId',
				title: 'Someone',
				localParticipant,
				state: 'ringing',
			};
			expect(derivePeerInfoFromInstanceState(state)).toEqual({
				displayName: 'Someone',
				userId: 'unknown',
				username: undefined,
			});
		});
	});

	describe('Direct Call', () => {
		it('returns internal peer info with user data from remote participant', () => {
			const state: IDirectMediaCallData = {
				confirmed: true,
				callId: 'callId',
				tempCallId: 'callId',
				service: 'webrtc',
				flags: ['internal'],
				features: ['audio'],
				hidden: false,
				transferredBy: null,
				localParticipant,
				remoteParticipant: {
					local: false,
					participantId: 'participantId',
					actorType: 'user',
					actorId: 'userId',
					role: 'caller',
					muted: false,
					held: false,
					contact: {
						type: 'user',
						id: 'userId123',
						displayName: 'John Doe',
						username: 'johndoe',
						sipExtension: '1001',
					},
					getMediaStream: () => null,
				},
				state: 'active',
			};
			expect(derivePeerInfoFromInstanceState(state)).toEqual({
				displayName: 'John Doe',
				userId: 'userId123',
				username: 'johndoe',
				callerId: '1001',
			});
		});

		it('returns external peer info with number from remote participant', () => {
			const state: IDirectMediaCallData = {
				confirmed: true,
				callId: 'callId',
				tempCallId: 'callId',
				service: 'webrtc',
				flags: ['internal'],
				features: ['audio'],
				hidden: false,
				transferredBy: null,
				localParticipant,
				remoteParticipant: {
					local: false,
					participantId: 'participantId',
					actorType: 'user',
					actorId: 'userId',
					role: 'caller',
					muted: false,
					held: false,
					contact: {
						type: 'sip',
						id: '+5511999999999',
					},
					getMediaStream: () => null,
				},
				state: 'active',
			};
			expect(derivePeerInfoFromInstanceState(state)).toEqual({
				number: '+5511999999999',
			});
		});
	});
});
