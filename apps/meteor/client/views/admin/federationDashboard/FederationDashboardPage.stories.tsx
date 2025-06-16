import type { Meta, StoryFn } from '@storybook/react';

import FederationDashboardPage from './FederationDashboardPage';

export default {
	title: 'Admin/Federation Dashboard/FederationDashboardPage',
	component: FederationDashboardPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof FederationDashboardPage>;

const Template: StoryFn<typeof FederationDashboardPage> = () => <FederationDashboardPage />;

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
			'federation:getServers': async () => ({
				data: [
					{
						_id: 'server-id-1',
						domain: 'open.rocket.chat',
					},
					{
						_id: 'server-id-2',
						domain: 'unstable.rocket.chat',
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
			'federation:getServers': 'infinite',
		},
	},
};

export const Errored = Template.bind({});
Errored.parameters = {
	serverContext: {
		callMethod: {
			'federation:getOverviewData': 'errored',
			'federation:getServers': 'errored',
		},
	},
};
