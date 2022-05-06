import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import CallJitsi from './CallJitsi';

export default {
	title: 'Room/Contextual Bar/CallJitsi',
	component: CallJitsi,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof CallJitsi>;

export const Default: ComponentStory<typeof CallJitsi> = (args) => <CallJitsi {...args} />;
Default.storyName = 'CallJitsi';
Default.args = {
	openNewWindow: true,
};
