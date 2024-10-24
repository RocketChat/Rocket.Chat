import type { OperationParams } from '@rocket.chat/rest-typings';

import type { VoipErrorSession, VoipIncomingSession, VoipOngoingSession, VoipOutgoingSession, VoipSession } from '../../definitions';

export const createMockFreeSwitchExtensionDetails = (
	overwrite?: Partial<OperationParams<'GET', '/v1/voip-freeswitch.extension.getDetails'>>,
) => ({
	extension: '1000',
	context: 'default',
	domain: '',
	groups: ['default'],
	status: 'REGISTERED' as const,
	contact: '',
	callGroup: 'techsupport',
	callerName: 'Extension 1000',
	callerNumber: '1000',
	userId: '',
	name: 'Administrator',
	username: 'administrator',
	success: true,
	...overwrite,
});

export const createMockVoipSession = (partial?: Partial<VoipSession>): VoipSession => ({
	type: 'INCOMING',
	contact: { name: 'test', id: '1000', host: '' },
	transferedBy: null,
	isMuted: false,
	isHeld: false,
	error: { status: -1, reason: '' },
	accept: jest.fn(),
	end: jest.fn(),
	mute: jest.fn(),
	hold: jest.fn(),
	dtmf: jest.fn(),
	...partial,
});

export const createMockVoipOngoingSession = (partial?: Partial<VoipOngoingSession>): VoipOngoingSession => ({
	type: 'ONGOING',
	contact: { name: 'test', id: '1000', host: '' },
	transferedBy: null,
	isMuted: false,
	isHeld: false,
	accept: jest.fn(),
	end: jest.fn(),
	mute: jest.fn(),
	hold: jest.fn(),
	dtmf: jest.fn(),
	...partial,
});

export const createMockVoipErrorSession = (partial?: Partial<VoipErrorSession>): VoipErrorSession => ({
	type: 'ERROR',
	contact: { name: 'test', id: '1000', host: '' },
	error: { status: -1, reason: '' },
	end: jest.fn(),
	...partial,
});

export const createMockVoipOutgoingSession = (partial?: Partial<VoipOutgoingSession>): VoipOutgoingSession => ({
	type: 'OUTGOING',
	contact: { name: 'test', id: '1000', host: '' },
	end: jest.fn(),
	...partial,
});

export const createMockVoipIncomingSession = (partial?: Partial<VoipIncomingSession>): VoipIncomingSession => ({
	type: 'INCOMING',
	contact: { name: 'test', id: '1000', host: '' },
	transferedBy: null,
	end: jest.fn(),
	accept: jest.fn(),
	...partial,
});
