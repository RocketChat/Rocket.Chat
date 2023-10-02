import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Contextualbar } from '../../../../components/Contextualbar';
import ExportMessages from './index';

export default {
	title: 'Room/Contextual Bar/ExportMessages',
	component: ExportMessages,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} as ComponentMeta<typeof ExportMessages>;

export const Default: ComponentStory<typeof ExportMessages> = () => <ExportMessages />;
Default.storyName = 'ExportMessages';
