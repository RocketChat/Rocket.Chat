import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { ImageAttachment } from '.';
import { sampleImage } from '../../../helpers.stories';

export default {
	title: 'Messages/ImageAttachment',
	component: ImageAttachment,
	args: {
		url: sampleImage,
	},
	parameters: {
		layout: 'centered',
	},
} satisfies ComponentMeta<typeof ImageAttachment>;

export const Default: ComponentStory<typeof ImageAttachment> = (args) => <ImageAttachment {...args} />;
Default.storyName = 'default';
