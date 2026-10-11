import type { StoryObj, Meta } from '@storybook/react';

import CannedResponsesComposer from './CannedResponsesComposer';

export default {
	component: CannedResponsesComposer,
} satisfies Meta<typeof CannedResponsesComposer>;

export const Default: StoryObj<typeof CannedResponsesComposer> = {
	name: 'CannedResponsesComposer',
};
