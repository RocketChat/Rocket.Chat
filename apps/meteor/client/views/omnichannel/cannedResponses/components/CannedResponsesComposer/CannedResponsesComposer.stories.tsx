import type { Meta, StoryFn } from '@storybook/react';

import CannedResponsesComposer from './CannedResponsesComposer';

export default {
	component: CannedResponsesComposer,
} satisfies Meta<typeof CannedResponsesComposer>;

export const Default: StoryFn<typeof CannedResponsesComposer> = (args) => <CannedResponsesComposer {...args} />;
Default.storyName = 'CannedResponsesComposer';
