import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import AutoTranslate from './AutoTranslate';

export default {
	title: 'Room/Contextual Bar/AutoTranslate',
	component: AutoTranslate,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof AutoTranslate>;

export const Default: ComponentStory<typeof AutoTranslate> = (args) => <AutoTranslate {...args} />;
Default.storyName = 'AutoTranslate';
Default.args = {
	language: 'en',
	languages: [
		['en', 'English'],
		['jp', 'Japanese'],
		['pt', 'Portuguese'],
	],
};
