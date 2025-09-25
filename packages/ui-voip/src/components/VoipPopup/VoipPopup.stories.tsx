import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import VoipPopup from './VoipPopup';
import { createMockVoipProviders } from '../../tests/mocks';

const [MockedProviders, voipClient] = createMockVoipProviders();

const appRoot = mockAppRoot().withMicrophonePermissionState({ state: 'granted' } as PermissionStatus);

export default {
	title: 'Components/VoipPopup',
	component: VoipPopup,
	decorators: [
		(Story) => (
			<MockedProviders>
				<Story />
			</MockedProviders>
		),
		appRoot.buildStoryDecorator(),
	],
} satisfies Meta<typeof VoipPopup>;

export const IncomingCall: StoryFn<typeof VoipPopup> = () => {
	voipClient.setSessionType('INCOMING');
	return <VoipPopup />;
};

export const OngoingCall: StoryFn<typeof VoipPopup> = () => {
	voipClient.setSessionType('ONGOING');
	return <VoipPopup />;
};

export const OutgoingCall: StoryFn<typeof VoipPopup> = () => {
	voipClient.setSessionType('OUTGOING');
	return <VoipPopup />;
};

export const ErrorCall: StoryFn<typeof VoipPopup> = () => {
	voipClient.setSessionType('ERROR');
	return <VoipPopup />;
};
