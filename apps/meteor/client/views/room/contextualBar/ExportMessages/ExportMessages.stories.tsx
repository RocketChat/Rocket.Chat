import type { Meta, StoryFn } from '@storybook/react';
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
} satisfies Meta<typeof ExportMessages>;

export const Default: StoryFn<typeof ExportMessages> = () => <ExportMessages />;
Default.storyName = 'ExportMessages';
