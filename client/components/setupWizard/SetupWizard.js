import React, { useMemo } from 'react';

import { SetupWizardSideBar } from './SetupWizardSideBar';
import { SetupWizardForms } from './SetupWizardForms';

const steps = [
	{
		id: 'admin-info',
		title: 'Admin_Info',
	},
	{
		id: 'org-info',
		title: 'Organization_Info',
	},
	{
		id: 'server-info',
		title: 'Server_Info',
	},
	{
		id: 'register-server',
		title: 'Register_Server',
	},
];

const toTitleCase = ([firstLetter, ...letters]) => `${ firstLetter.toUpperCase() }${ letters.join('') }`;

export function SetupWizard({ wizardSettings, state, setState }) {
	const currentStep = useMemo(() => steps[state.currentStep - 1], [state.currentStep]);
	const formState = useMemo(() => Object.entries(state)
		.filter(([key]) => key.startsWith('registration-'))
		.map(([key, value]) => [key.slice('registration-'.length), {
			value,
			invalid: state[`invalid${ toTitleCase(key.slice('registration-'.length)) }`],
			setValue: (newValue) => setState(key, newValue),
		}])
		.reduce((state, [key, value]) => ({ ...state, [key]: value }), {}),
	[state]);

	return <div className='setup-wizard'>
		<SetupWizardSideBar steps={steps} currentStep={currentStep} />
		<SetupWizardForms
			steps={steps}
			currentStep={currentStep}
			formState={formState}
			settings={wizardSettings}
			input={state}
		/>
	</div>;
}
