import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import CannedResponsesComposer from './CannedResponsesComposer';

export default {
	title: 'Enterprise/Omnichannel/CannedResponsesComposer',
	component: CannedResponsesComposer,
} as ComponentMeta<typeof CannedResponsesComposer>;

export const Default: ComponentStory<typeof CannedResponsesComposer> = (args) => <CannedResponsesComposer {...args} />;
Default.storyName = 'CannedResponsesComposer';
