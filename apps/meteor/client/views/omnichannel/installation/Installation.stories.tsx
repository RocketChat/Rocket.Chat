import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Installation from './Installation';

export default {
	title: 'Omnichannel/Installation',
	component: Installation,
} as ComponentMeta<typeof Installation>;

export const Default: ComponentStory<typeof Installation> = () => <Installation />;
Default.storyName = 'Installation';
