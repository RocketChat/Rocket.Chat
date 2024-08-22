import { action } from '@storybook/addon-actions';
import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Sound } from '.';
import { beepAudio, sampleAudio } from '../../../.storybook/helpers';

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
} satisfies Meta<ComponentProps<typeof Sound>>;

const Template: Story<ComponentProps<typeof Sound>> = (args) => <Sound {...args} />;

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
