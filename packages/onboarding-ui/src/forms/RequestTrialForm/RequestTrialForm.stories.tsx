import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { countries } from 'countries-list';

import RequestTrialForm from './RequestTrialForm';

export default {
	title: 'forms/RequestTrialForm',
	component: RequestTrialForm,
	parameters: {
		layout: 'centered',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		validateEmail: (email) => (email === 'rocket@rocket.chat' ? 'invalid email' : true),
		organizationSizeOptions: [
			['0', '1-10 people'],
			['1', '11-50 people'],
			['2', '51-100 people'],
			['3', '101-250 people'],
			['4', '251-500 people'],
			['5', '501-1000 people'],
			['6', '1001-4000 people'],
			['7', '4001 or more people'],
		],
		countryOptions: [
			...Object.entries(countries).map(([code, { name }]): [value: string, label: string] => [code, name]),
			['worldwide', 'Worldwide'],
		],
	},
} satisfies Meta<typeof RequestTrialForm>;

export const _RequestTrialForm: StoryFn<typeof RequestTrialForm> = (args) => <RequestTrialForm {...args} />;
_RequestTrialForm.storyName = 'RequestTrialForm';
