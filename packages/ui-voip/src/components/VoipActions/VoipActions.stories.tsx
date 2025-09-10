import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import VoipActions from './VoipActions';

const noop = () => undefined;

export default {
	title: 'Components/VoipActions',
	component: VoipActions,
	decorators: [
		mockAppRoot()
			.withMicrophonePermissionState({ state: 'granted' } as PermissionStatus)
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof VoipActions>;

export const IncomingActions: StoryFn<typeof VoipActions> = () => {
	return <VoipActions onDecline={noop} onAccept={noop} />;
};

export const OngoingActions: StoryFn<typeof VoipActions> = () => {
	return <VoipActions onEndCall={noop} onDTMF={noop} onHold={noop} onMute={noop} onTransfer={noop} />;
};

export const OutgoingActions: StoryFn<typeof VoipActions> = () => {
	return <VoipActions onEndCall={noop} />;
};
