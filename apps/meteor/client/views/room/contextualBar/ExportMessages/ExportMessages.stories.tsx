import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { ContextualbarContainer } from '../../../../components/Contextualbar';
import ExportMessages from './index';

export default {
	title: 'Room/Contextual Bar/ExportMessages',
	component: ExportMessages,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <ContextualbarContainer height='100vh'>{fn()}</ContextualbarContainer>],
} as ComponentMeta<typeof ExportMessages>;

export const Default: ComponentStory<typeof ExportMessages> = (args) => <ExportMessages {...args} />;
Default.storyName = 'ExportMessages';
