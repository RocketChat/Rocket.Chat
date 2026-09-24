import type { StoryFn, Meta } from '@storybook/react-webpack5';
import { countries } from 'countries-list';

import RequestTrialPage from './RequestTrialPage';

export default {
	title: 'pages/RequestTrialPage',
	component: RequestTrialPage,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		layout: 'fullscreen',
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
} satisfies Meta<typeof RequestTrialPage>;

export const _RequestTrialPage: StoryFn<typeof RequestTrialPage> = (args) => <RequestTrialPage {...args} />;
_RequestTrialPage.storyName = 'RequestTrialPage';
