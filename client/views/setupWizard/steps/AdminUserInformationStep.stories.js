import React from 'react';

import AdminUserInformationStep from './AdminUserInformationStep';

export default {
	title: 'views/setupWizard/steps/AdminUserInformationStep',
	component: AdminUserInformationStep,
};

export const _default = () =>
	<AdminUserInformationStep
		step={[1, 2, 3, 4, 'final'][0]}
		title={'Admin Info'}
		active={true}
	/>;
