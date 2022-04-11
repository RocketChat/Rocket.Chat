import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import NotAvailableOnCall from './NotAvailableOnCall';

export default {
	title: 'Components/VoIP/Composer/NotAvailableOnCall',
	component: NotAvailableOnCall,
} as ComponentMeta<typeof NotAvailableOnCall>;

export const Default: ComponentStory<typeof NotAvailableOnCall> = () => <NotAvailableOnCall />;
Default.storyName = 'NotAvailableOnCall';
