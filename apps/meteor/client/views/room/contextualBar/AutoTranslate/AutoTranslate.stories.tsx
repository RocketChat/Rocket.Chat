import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Contextualbar } from '../../../../components/Contextualbar';
import AutoTranslate from './AutoTranslate';

export default {
	title: 'Room/Contextual Bar/AutoTranslate',
	component: AutoTranslate,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
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
