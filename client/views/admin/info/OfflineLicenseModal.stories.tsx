import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import OfflineLicenseModal from './OfflineLicenseModal';

export default {
	title: 'Community/Views/Admin/Info/OfflineLicenseModal',
	component: OfflineLicenseModal,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} as ComponentMeta<typeof OfflineLicenseModal>;

export const Default: ComponentStory<typeof OfflineLicenseModal> = (args) => <OfflineLicenseModal {...args} />;
Default.storyName = 'OfflineLicenseModal';
