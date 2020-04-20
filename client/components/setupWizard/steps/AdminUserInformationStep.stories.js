import { boolean, select, text } from '@storybook/addon-knobs';
import React from 'react';

import { AdminUserInformationStep } from './AdminUserInformationStep';

export default {
	title: 'setupWizard/steps/AdminUserInformationStep',
	component: AdminUserInformationStep,
};

export const _default = () =>
	<AdminUserInformationStep
		step={select('step', [1, 2, 3, 4, 'final'], 1)}
		title={text('title', 'Admin Info')}
		active={boolean('active', true)}
	/>;
