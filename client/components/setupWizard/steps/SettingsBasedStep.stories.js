import { boolean, select, text } from '@storybook/addon-knobs';
import React from 'react';

import { SettingsBasedStep } from './SettingsBasedStep';

export default {
	title: 'setupWizard/steps/SettingsBasedStep',
	component: SettingsBasedStep,
};

export const _default = () =>
	<SettingsBasedStep
		step={select('step', [1, 2, 3, 4, 'final'], 2)}
		title={text('title', 'Settings-Based Step')}
		active={boolean('active', true)}
	/>;
