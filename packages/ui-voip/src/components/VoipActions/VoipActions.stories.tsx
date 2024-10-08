import { ComponentMeta, ComponentStory } from '@storybook/react';
import { ReactElement } from 'react';

import VoipActions from './VoipActions';

const noop = () => undefined;

export default {
	title: 'Components/VoipActions',
	component: VoipActions,
	decorators: [(Story): ReactElement => <Story />],
} satisfies ComponentMeta<typeof VoipActions>;

export const IncomingActions: ComponentStory<typeof VoipActions> = () => {
	return <VoipActions onDecline={noop} onAccept={noop} />;
};

export const OngoingActions: ComponentStory<typeof VoipActions> = () => {
	return <VoipActions onEndCall={noop} onDTMF={noop} onHold={noop} onMute={noop} onTransfer={noop} />;
};

export const OutgoingActions: ComponentStory<typeof VoipActions> = () => {
	return <VoipActions onEndCall={noop} />;
};
