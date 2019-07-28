import { TAPi18n } from 'meteor/tap:i18n';
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

export function SetupWizard({ wizardSettings, state, setState, allowStandaloneServer }) {
	const currentStep = useMemo(() => steps[state.currentStep - 1], [state.currentStep]);
	const formState = useMemo(() => [
		...['name', 'username', 'email', 'pass']
			.map((key) => [key, {
				id: key,
				value: state[`registration-${ key }`],
				invalid: state[`invalid${ toTitleCase(key) }`],
				setValue: (newValue) => setState(`registration-${ key }`, newValue),
			}]),
		...wizardSettings
			.sort(({ wizard: { order: a } }, { wizard: { order: b } }) => a - b)
			.map(({ _id, type, i18nLabel, values, wizard }) => [_id, {
				step: steps[wizard.step - 1],
				id: _id,
				type,
				label: i18nLabel,
				value: state[_id],
				options: (
					type === 'select'
				&& values
				&& values.map(({ i18nLabel, key }) => ({ optionLabel: i18nLabel, optionValue: key }))
				)
				|| (
					type === 'language'
				&& [{
					optionLabel: 'Default',
					optionValue: '',
				}].concat(
					Object.entries(TAPi18n.getLanguages())
						.map(([key, { name }]) => ({ optionLabel: name, optionValue: key }))
						.sort((a, b) => a.key - b.key)
				)
				),
				setValue: (newValue) => setState(_id, newValue),
			}]),
		['optIn', {
			id: 'optIn',
			value: state.optIn,
			setValue: (newValue) => setState('optIn', newValue),
		}],
		['registerServer', {
			id: 'registerServer',
			value: state.registerServer,
			setValue: (newValue) => setState('registerServer', newValue),
		}],
	].reduce((state, [key, value]) => ({ ...state, [key]: value }), {}),
	[wizardSettings, state, setState]);

	return <div className='setup-wizard'>
		<SetupWizardSideBar steps={steps} currentStep={currentStep} />
		<SetupWizardForms
			steps={steps}
			currentStep={currentStep}
			formState={formState}
			allowStandaloneServer={allowStandaloneServer}
		/>
	</div>;
}
