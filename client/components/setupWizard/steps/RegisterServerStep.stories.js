import { boolean, select, text } from '@storybook/addon-knobs';
import React from 'react';

import { RegisterServerStep } from './RegisterServerStep';

export default {
	title: 'setupWizard/steps/RegisterServerStep',
	component: RegisterServerStep,
};

export const _default = () =>
	<RegisterServerStep
		step={select('step', [1, 2, 3, 4, 'final'], 4)}
		title={text('title', 'Register Server')}
		active={boolean('active', true)}
	/>;
