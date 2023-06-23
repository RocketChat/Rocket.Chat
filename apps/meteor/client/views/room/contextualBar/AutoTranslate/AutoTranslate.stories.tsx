import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { ContextualbarContainer } from '../../../../components/Contextualbar';
import AutoTranslate from './AutoTranslate';

export default {
	title: 'Room/Contextual Bar/AutoTranslate',
	component: AutoTranslate,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <ContextualbarContainer height='100vh'>{fn()}</ContextualbarContainer>],
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
