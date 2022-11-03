import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import LicenseCard from './LicenseCard';

export default {
	title: 'Admin/Info/LicenseCard',
	component: LicenseCard,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta<typeof LicenseCard>;

const Template: ComponentStory<typeof LicenseCard> = () => <LicenseCard />;

export const Example = Template.bind({});
Example.parameters = {
	serverContext: {
		callEndpoint: {
			'GET /v1/licenses.get': async () => ({
				licenses: [
					{
						url: 'https://example.com/license.txt',
						expiry: '2020-01-01T00:00:00.000Z',
						maxActiveUsers: 100,
						modules: ['auditing'],
						maxGuestUsers: 100,
						maxRoomsPerGuest: 100,
					},
				],
			}),
		},
		callMethod: {
			'license:getTags': async () => [{ name: 'Example plan', color: 'red' }],
		},
	},
};

export const MultipleLicenses = Template.bind({});
MultipleLicenses.parameters = {
	serverContext: {
		callEndpoint: {
			'GET /v1/licenses.get': async () => ({
				licenses: [
					{
						url: 'https://example.com/license.txt',
						expiry: '2020-01-01T00:00:00.000Z',
						maxActiveUsers: 100,
						modules: ['auditing'],
						maxGuestUsers: 100,
						maxRoomsPerGuest: 100,
					},
					{
						url: 'https://example.com/license.txt',
						expiry: '2020-01-01T00:00:00.000Z',
						maxActiveUsers: 100,
						modules: ['engagement-dashboard'],
						maxGuestUsers: 100,
						maxRoomsPerGuest: 100,
					},
				],
			}),
		},
		callMethod: {
			'license:getTags': async () => [{ name: 'Example plan', color: 'red' }],
		},
	},
};

export const Loading = Template.bind({});
Loading.parameters = {
	serverContext: {
		callEndpoint: {
			'GET /v1/licenses.get': 'infinite',
		},
		callMethod: {
			'license:getTags': 'infinite',
		},
	},
};

export const Errored = Template.bind({});
Errored.parameters = {
	serverContext: {
		callEndpoint: {
			'GET /v1/licenses.get': 'errored',
		},
		callMethod: {
			'license:getTags': 'errored',
		},
	},
};
