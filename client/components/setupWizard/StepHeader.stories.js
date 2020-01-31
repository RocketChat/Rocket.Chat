import { number, text } from '@storybook/addon-knobs';
import React from 'react';

import { StepHeader } from './StepHeader';

export default {
	title: 'setupWizard/StepHeader',
	component: StepHeader,
};

export const _default = () =>
	<StepHeader
		number={number('number', 1)}
		title={text('title', 'Title')}
	/>;
