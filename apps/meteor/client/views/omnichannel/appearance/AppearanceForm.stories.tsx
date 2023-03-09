import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import AppearanceForm from './AppearanceForm';

export default {
	title: 'Omnichannel/AppearanceForm',
	component: AppearanceForm,
} as ComponentMeta<typeof AppearanceForm>;

export const Default: ComponentStory<typeof AppearanceForm> = (args) => <AppearanceForm {...args} />;
Default.storyName = 'AppearanceForm';
