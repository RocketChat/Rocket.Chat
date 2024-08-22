import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import UninstallGrandfatheredAppModal from './UninstallGrandfatheredAppModal';

export default {
	title: 'Marketplace/components/UninstallGrandfatheredAppModal',
	component: UninstallGrandfatheredAppModal,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta<typeof UninstallGrandfatheredAppModal>;

const Template: ComponentStory<typeof UninstallGrandfatheredAppModal> = (args) => <UninstallGrandfatheredAppModal {...args} />;

export const Default = Template.bind({});
Default.storyName = 'UninstallGrandfatheredAppModal';
Default.args = {
	appName: 'Example-App-Name',
};
