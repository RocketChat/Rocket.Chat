import React from 'react';

export function StepContent(props) {
	return <section className='setup-wizard-forms__content'>
		<div className='setup-wizard-forms__content-step setup-wizard-forms__content-step--active' {...props} />
	</section>;
}
