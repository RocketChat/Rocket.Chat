import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar/VerticalBar';
import ExportMessages from './index';

export default {
	title: 'Room/Contextual Bar/ExportMessages',
	component: ExportMessages,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof ExportMessages>;

export const Default: ComponentStory<typeof ExportMessages> = (args) => <ExportMessages {...args} />;
Default.storyName = 'ExportMessages';
