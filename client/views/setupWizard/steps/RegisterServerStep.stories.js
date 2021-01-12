import React from 'react';

import RegisterServerStep from './RegisterServerStep';

export default {
	title: 'views/setupWizard/steps/RegisterServerStep',
	component: RegisterServerStep,
};

export const _default = () =>
	<RegisterServerStep
		step={[1, 2, 3, 4, 'final'][3]}
		title={'Register Server'}
		active={true}
	/>;
