import type { Meta, StoryFn } from '@storybook/react';

import OverviewSection from './OverviewSection';

export default {
	title: 'Admin/Federation Dashboard/OverviewSection',
	component: OverviewSection,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof OverviewSection>;

const Template: StoryFn<typeof OverviewSection> = () => <OverviewSection />;

export const Example = Template.bind({});
Example.parameters = {
	serverContext: {
		callMethod: {
			'federation:getOverviewData': async () => ({
				data: [
					{
						title: 'Number_of_events',
						value: 123,
					},
					{
						title: 'Number_of_federated_users',
						value: 123,
					},
					{
						title: 'Number_of_federated_servers',
						value: 123,
					},
				],
			}),
		},
	},
};

export const Loading = Template.bind({});
Loading.parameters = {
	serverContext: {
		callMethod: {
			'federation:getOverviewData': 'infinite',
		},
	},
};

export const Errored = Template.bind({});
Errored.parameters = {
	serverContext: {
		callMethod: {
			'federation:getOverviewData': 'errored',
		},
	},
};
