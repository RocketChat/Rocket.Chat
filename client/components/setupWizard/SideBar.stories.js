import { select } from '@storybook/addon-knobs';
import React from 'react';

import { SideBar } from './SideBar';

export default {
	title: 'setupWizard/SideBar',
	component: SideBar,
};

export const _default = () =>
	<SideBar
		logoSrc='https://open.rocket.chat/images/logo/logo.svg'
		steps={[
			{
				step: 1,
				title: 'Define the problem',
			},
			{
				step: 2,
				title: 'Generate alternative solutions',
			},
			{
				step: 3,
				title: 'Select an alternative',
			},
			{
				step: 4,
				title: 'Implement the solution',
			},
		]}
		currentStep={select('currentStep', [1, 2, 3, 4])}
	/>;

export const atSomeStep = () =>
	<SideBar
		logoSrc='https://open.rocket.chat/images/logo/logo.svg'
		steps={[
			{
				step: 1,
				title: 'Define the problem',
			},
			{
				step: 2,
				title: 'Generate alternative solutions',
			},
			{
				step: 3,
				title: 'Select an alternative',
			},
			{
				step: 4,
				title: 'Implement the solution',
			},
		]}
		currentStep={2}
	/>;
