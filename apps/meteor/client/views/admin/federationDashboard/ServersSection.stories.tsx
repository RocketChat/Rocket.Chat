import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import ServersSection from './ServersSection';

export default {
	title: 'Admin/Federation Dashboard/ServersSection',
	component: ServersSection,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof ServersSection>;

const Template: ComponentStory<typeof ServersSection> = () => <ServersSection />;

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
