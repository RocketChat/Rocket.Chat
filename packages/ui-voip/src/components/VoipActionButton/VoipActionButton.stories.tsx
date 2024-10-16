import type { Meta, StoryFn } from '@storybook/react';
import type { ReactElement } from 'react';

import VoipActionButton from './VoipActionButton';

export default {
	title: 'Components/VoipActionButton',
	component: VoipActionButton,
	decorators: [(Story): ReactElement => <Story />],
} satisfies Meta<typeof VoipActionButton>;

export const SuccessButton: StoryFn<typeof VoipActionButton> = () => {
	return <VoipActionButton success icon='phone' label='Success Button' />;
};

export const DangerButton: StoryFn<typeof VoipActionButton> = () => {
	return <VoipActionButton danger icon='phone' label='Danger Button' />;
};

export const NeutralButton: StoryFn<typeof VoipActionButton> = () => {
	return <VoipActionButton icon='phone' label='Neutral Button' />;
};
