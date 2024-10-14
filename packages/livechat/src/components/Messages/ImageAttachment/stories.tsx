import type { Meta, StoryFn } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { ImageAttachment } from '.';
import { sampleImage } from '../../../../.storybook/helpers';

export default {
	title: 'Messages/ImageAttachment',
	component: ImageAttachment,
	args: {
		url: sampleImage,
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof ImageAttachment>>;

export const Default: StoryFn<ComponentProps<typeof ImageAttachment>> = (args) => <ImageAttachment {...args} />;
Default.storyName = 'default';
