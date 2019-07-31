import React from 'react';

export const Step = ({ children, active, working = false, ...props }) =>
	<fieldset
		className={[
			'setup-wizard-forms__box',
			'setup-wizard-forms__box--loaded',
		].filter(Boolean).join(' ')}
		{...!active && { style: { display: 'none' } }}
		disabled={working}
		{...props}
	>
		{children}
	</fieldset>;
