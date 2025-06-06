import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import { AppLogsFilter } from './AppLogsFilter';

export default {
	title: 'Components/AppLogsFilter',
	component: AppLogsFilter,
	args: {},
	decorators: [
		mockAppRoot()
			// @ts-expect-error mock endpoint while we do not have the real one
			.withEndpoint('GET', '/v1/apps/instances', () => [
				['instanceId', 'instanceName'],
				['node1', 'node1'],
				['node2', 'node2'],
				['node3', 'node3'],
				['node4', 'node4'],
			])
			.withTranslations('en', 'core', { App_name: 'App Name' })
			.buildStoryDecorator(),
		(fn) => {
			const methods = useForm({});

			return <FormProvider {...methods}>{fn()}</FormProvider>;
		},
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof AppLogsFilter>;

export const Simple = () => <AppLogsFilter />;
