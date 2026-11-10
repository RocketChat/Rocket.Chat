import type { StoryFn, Meta } from '@storybook/react-webpack5';
import { countries } from 'countries-list';

import OrganizationInfoForm from './OrganizationInfoForm';

export default {
	title: 'forms/OrganizationInfoForm',
	component: OrganizationInfoForm,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'centered',
	},
	args: {
		currentStep: 1,
		stepCount: 1,
		organizationIndustryOptions: [
			['aerospaceDefense', 'Aerospace and Defense'],
			['blockchain', 'Blockchain'],
			['consulting', 'Consulting'],
			['consumerGoods', 'Consumer Packaged Goods'],
			['contactCenter', 'Contact Center'],
			['education', 'Education'],
			['entertainment', 'Entertainment'],
			['financialServices', 'Financial Services'],
			['gaming', 'Gaming'],
			['healthcare', 'Healthcare'],
			['hospitalityBusinness', 'Hospitality Businness'],
			['insurance', 'Insurance'],
			['itSecurity', 'IT Security'],
			['logistics', 'Logistics'],
			['manufacturing', 'Manufacturing'],
			['media', 'Media'],
			['pharmaceutical', 'Pharmaceutical'],
			['realEstate', 'Real Estate'],
			['religious', 'Religious'],
			['retail', 'Retail'],
			['socialNetwork', 'Social Network'],
			['technologyProvider', 'Technology Provider'],
			['technologyServices', 'Technology Services'],
			['telecom', 'Telecom'],
			['utilities', 'Utilities'],
			['other', 'Other'],
		],
		organizationSizeOptions: [
			['0', '1-250 people'],
			['1', '251-500 people'],
			['2', '501-1000 people'],
			['3', '1001-4000 people'],
			['4', '4001 or more people'],
		],
		countryOptions: [
			...Object.entries(countries).map(([code, { name }]): [value: string, label: string] => [code, name]),
			['worldwide', 'Worldwide'],
		],
	},
} satisfies Meta<typeof OrganizationInfoForm>;

export const _OrganizationInfoForm: StoryFn<typeof OrganizationInfoForm> = (args) => <OrganizationInfoForm {...args} />;
_OrganizationInfoForm.storyName = 'OrganizationInfoForm';
