import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { Sound } from '.';
import { beepAudio, sampleAudio } from '../../helpers.stories';

export default {
	title: 'Components/Sound',
	component: Sound,
	args: {
		play: false,
		onStart: action('start'),
		onStop: action('stop'),
	},
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof Sound>;

const Template: ComponentStory<typeof Sound> = (args) => <Sound {...args} />;

export const Short = Template.bind({});
Short.storyName = 'short';
Short.args = {
	src: beepAudio,
};

export const Long = Template.bind({});
Long.storyName = 'long';
Long.args = {
	src: sampleAudio,
};
