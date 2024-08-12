import type { Meta, Story } from '@storybook/preact';
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

export const Default: Story<ComponentProps<typeof ImageAttachment>> = (args) => <ImageAttachment {...args} />;
Default.storyName = 'default';
