import { Emitter } from '@rocket.chat/emitter';
import { MockedModalContext } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { VoipContext } from '../../contexts/VoipContext';
import type { VoipSession } from '../../definitions';
import type VoipClient from '../../lib/VoipClient';
import VoipPopup from './VoipPopup';

const MockVoipClient = class extends Emitter {
	private _sessionType: VoipSession['type'] = 'INCOMING';

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
		} as VoipSession);
};

const client = new MockVoipClient();

const contextValue = {
	isEnabled: true as const,
	voipClient: client as unknown as VoipClient,
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

export default {
	title: 'Components/VoipPopup',
	component: VoipPopup,
	decorators: [
		(Story): ReactElement => (
			<QueryClientProvider client={queryClient}>
				<MockedModalContext>
					<VoipContext.Provider value={contextValue}>
						<Story />
					</VoipContext.Provider>
				</MockedModalContext>
			</QueryClientProvider>
		),
	],
} satisfies Meta<typeof VoipPopup>;

export const IncomingCall: StoryFn<typeof VoipPopup> = () => {
	client.setSessionType('INCOMING');
	return <VoipPopup />;
};

export const OngoingCall: StoryFn<typeof VoipPopup> = () => {
	client.setSessionType('ONGOING');
	return <VoipPopup />;
};

export const OutgoingCall: StoryFn<typeof VoipPopup> = () => {
	client.setSessionType('OUTGOING');
	return <VoipPopup />;
};

export const ErrorCall: StoryFn<typeof VoipPopup> = () => {
	client.setSessionType('ERROR');
	return <VoipPopup />;
};
