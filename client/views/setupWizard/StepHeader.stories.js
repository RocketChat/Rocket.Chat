import React from 'react';

import { StepHeader } from './StepHeader';

export default {
	title: 'views/setupWizard/StepHeader',
	component: StepHeader,
};

export const _default = () =>
	<StepHeader
		number={1}
		title={'Title'}
	/>;
