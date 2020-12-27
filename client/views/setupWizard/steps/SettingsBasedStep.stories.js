import React from 'react';

import SettingsBasedStep from './SettingsBasedStep';

export default {
	title: 'views/setupWizard/steps/SettingsBasedStep',
	component: SettingsBasedStep,
};

export const _default = () =>
	<SettingsBasedStep
		step={[1, 2, 3, 4, 'final'][1]}
		title={'Settings-Based Step'}
		active={true}
	/>;
