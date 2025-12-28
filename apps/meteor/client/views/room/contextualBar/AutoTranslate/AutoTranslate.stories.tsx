import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';

import AutoTranslate from './AutoTranslate';

export default {
	component: AutoTranslate,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof AutoTranslate>;

export const Default: StoryFn<typeof AutoTranslate> = (args) => <AutoTranslate {...args} />;
Default.storyName = 'AutoTranslate';
Default.args = {
	language: 'en',
	languages: [
		['en', 'English'],
		['jp', 'Japanese'],
		['pt', 'Portuguese'],
	],
};
