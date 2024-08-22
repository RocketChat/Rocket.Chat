import type { Meta, Story } from '@storybook/preact';
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

export const Default: Story<ComponentProps<typeof AudioAttachment>> = (args) => <AudioAttachment {...args} />;
Default.storyName = 'default';
Default.args = {
	url: sampleAudio,
};
