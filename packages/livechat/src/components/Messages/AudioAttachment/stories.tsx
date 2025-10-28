import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import AudioAttachment from '.';
import { sampleAudio } from '../../../../.storybook/helpers';

export default {
	title: 'Messages/AudioAttachment',
	component: AudioAttachment,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof AudioAttachment>>;

export const Default: StoryFn<ComponentProps<typeof AudioAttachment>> = (args) => <AudioAttachment {...args} />;
Default.storyName = 'default';
Default.args = {
	url: sampleAudio,
};
