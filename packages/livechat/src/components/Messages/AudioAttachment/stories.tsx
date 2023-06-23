import type { ComponentMeta, ComponentStory } from '@storybook/react';

import AudioAttachment from '.';
import { sampleAudio } from '../../../helpers.stories';

export default {
	title: 'Messages/AudioAttachment',
	component: AudioAttachment,
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof AudioAttachment>;

export const Default: ComponentStory<typeof AudioAttachment> = (args) => <AudioAttachment {...args} />;
Default.storyName = 'default';
Default.args = {
	url: sampleAudio,
};
