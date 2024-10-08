import { ComponentMeta, ComponentStory } from '@storybook/react';
import { ReactElement } from 'react';

import VoipActionButton from './VoipActionButton';

export default {
	title: 'Components/VoipActionButton',
	component: VoipActionButton,
	decorators: [(Story): ReactElement => <Story />],
} satisfies ComponentMeta<typeof VoipActionButton>;

export const SuccessButton: ComponentStory<typeof VoipActionButton> = () => {
	return <VoipActionButton success icon='phone' label='Success Button' />;
};

export const DangerButton: ComponentStory<typeof VoipActionButton> = () => {
	return <VoipActionButton danger icon='phone' label='Danger Button' />;
};

export const NeutralButton: ComponentStory<typeof VoipActionButton> = () => {
	return <VoipActionButton icon='phone' label='Neutral Button' />;
};
