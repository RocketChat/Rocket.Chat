import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import AuditPage from './AuditPage';

export default {
	title: 'Enterprise/Auditing/AuditPage',
	component: AuditPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof AuditPage>;

export const Default: ComponentStory<typeof AuditPage> = () => <AuditPage />;
Default.storyName = 'AuditPage';
