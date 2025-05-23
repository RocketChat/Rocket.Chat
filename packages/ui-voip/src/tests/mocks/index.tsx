import { Emitter } from '@rocket.chat/emitter';
import { MockedModalContext } from '@rocket.chat/mock-providers';
import type { OperationParams } from '@rocket.chat/rest-typings';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

import { VoipContext } from '../../contexts/VoipContext';
import type { VoipErrorSession, VoipIncomingSession, VoipOngoingSession, VoipOutgoingSession, VoipSession } from '../../definitions';
import type VoipClient from '../../lib/VoipClient';

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

class MockVoipClient extends Emitter {
	public _sessionType: VoipSession['type'] = 'INCOMING';

	setSessionType(type: VoipSession['type']) {
		this._sessionType = type;
		setTimeout(() => this.emit('stateChanged'), 0);
	}

	getSession = () =>
		({
			type: this._sessionType,
			contact: { id: '1000', host: '', name: 'John Doe' },
			transferedBy: null,
			isMuted: false,
			isHeld: false,
			accept: async () => undefined,
			end: async () => undefined,
			mute: async (..._: any[]) => undefined,
			hold: async (..._: any[]) => undefined,
			dtmf: async () => undefined,
			error: { status: 488, reason: '' },
		}) as VoipSession;
}

export function createMockVoipProviders(): [React.FC<{ children: ReactNode }>, InstanceType<typeof MockVoipClient>] {
	const voipClient = new MockVoipClient();

	const contextValue = {
		isEnabled: true as const,
		voipClient: voipClient as unknown as VoipClient,
		error: null,
		changeAudioInputDevice: async () => undefined,
		changeAudioOutputDevice: async () => undefined,
	};

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	const Provider = ({ children }: { children: ReactNode }) => {
		return (
			<QueryClientProvider client={queryClient}>
				<MockedModalContext>
					<VoipContext.Provider value={contextValue}>{children}</VoipContext.Provider>
				</MockedModalContext>
			</QueryClientProvider>
		);
	};

	return [Provider, voipClient];
}
