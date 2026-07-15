import { Contextualbar } from '@rocket.chat/ui-client';
import type { StoryObj, Meta } from '@storybook/react';

import AutoTranslate from './AutoTranslate';

export default {
	component: AutoTranslate,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof AutoTranslate>;

export const Default: StoryObj<typeof AutoTranslate> = {
	name: 'AutoTranslate',

	args: {
		language: 'en',
		languages: [
			['en', 'English'],
			['jp', 'Japanese'],
			['pt', 'Portuguese'],
		],
	},
};
