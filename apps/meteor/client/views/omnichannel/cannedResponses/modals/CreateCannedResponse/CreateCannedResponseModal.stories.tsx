import type { Meta } from '@storybook/react';

import CreateCannedResponseModal from './CreateCannedResponseModal';

export default {
	component: CreateCannedResponseModal,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} satisfies Meta<typeof CreateCannedResponseModal>;

export const Default = {};
