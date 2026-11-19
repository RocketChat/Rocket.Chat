import type { Meta, StoryObj } from '@storybook/react';

import AppsPageConnectionError from './AppsPageConnectionError';

export default {
	component: AppsPageConnectionError,
	parameters: {
		layout: 'fullscreen',
	},
	argTypes: {
		onButtonClick: { action: 'onButtonClick' },
	},
} satisfies Meta<typeof AppsPageConnectionError>;

export const Default: StoryObj<typeof AppsPageConnectionError> = {};
