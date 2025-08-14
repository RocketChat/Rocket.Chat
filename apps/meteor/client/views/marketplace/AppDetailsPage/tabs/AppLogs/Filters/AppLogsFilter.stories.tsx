import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/react';
import { FormProvider } from 'react-hook-form';

import { AppLogsFilter } from './AppLogsFilter';
import { useAppLogsFilterForm } from '../useAppLogsFilterForm';

export default {
	title: 'Marketplace/AppDetailsPage/AppLogs/Filters/AppLogsFilter',
	component: AppLogsFilter,
	args: {},
	decorators: [
		mockAppRoot()
			.withEndpoint('GET', '/apps/:id/logs/distinctValues', () => ({
				success: true,
				instanceIds: ['instance-1', 'instance-2', 'instance-3'],
				methods: ['method-1', 'method-2', 'method-3'],
			}))
			.buildStoryDecorator(),
		(fn) => {
			const methods = useAppLogsFilterForm();

			return (
				<FormProvider {...methods}>
					<Box p={16}>{fn()}</Box>
				</FormProvider>
			);
		},
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof AppLogsFilter>;

export const Default = () => (
	<AppLogsFilter
		appId='app-id'
		expandAll={action('expandAll')}
		collapseAll={action('collapseAll')}
		refetchLogs={action('refetchLogs')}
		isLoading={false}
	/>
);
