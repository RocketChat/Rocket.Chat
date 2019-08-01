import React from 'react';

import './Step.css';

export const Step = ({ active, working = false, ...props }) =>
	<fieldset
		className={[
			'SetupWizard__Step',
			active && 'SetupWizard__Step--active',
			working && 'SetupWizard__Step--working',
		].filter(Boolean).join(' ')}
		disabled={working}
		{...props}
	/>;
