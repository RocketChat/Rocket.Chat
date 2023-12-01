import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import MarkdownTextEditor from '.';

export default {
	title: 'Enterprise/Omnichannel/MarkdownTextEditor',
	component: MarkdownTextEditor,
} as ComponentMeta<typeof MarkdownTextEditor>;

export const Default: ComponentStory<typeof MarkdownTextEditor> = (args) => <MarkdownTextEditor {...args} />;
Default.storyName = 'MarkdownTextEditor';
