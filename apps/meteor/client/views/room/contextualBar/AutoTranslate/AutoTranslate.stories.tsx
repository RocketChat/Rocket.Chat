import { Box } from '@rocket.chat/fuselage';
import { Contextualbar } from '@rocket.chat/ui-client';
import type { StoryObj, Meta } from '@storybook/react';

import AutoTranslate from './AutoTranslate';

export default {
	component: AutoTranslate,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(fn) => (
			<Box height='100vh'>
				<Contextualbar>{fn()}</Contextualbar>
			</Box>
		),
	],
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
