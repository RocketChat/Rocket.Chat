import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import { AppLogsFilter } from './AppLogsFilter';

export default {
	title: 'Marketplace/AppDetailsPage/AppLogs/Filters/AppLogsFilter',
	component: AppLogsFilter,
	args: {},
	decorators: [
		mockAppRoot()
			.withEndpoint('GET', '/apps/logs/instanceIds', () => ({
				success: true,
				instanceIds: ['instance-1', 'instance-2', 'instance-3'],
			}))
			.buildStoryDecorator(),
		(fn) => {
			const methods = useForm({});

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

export const Default = () => <AppLogsFilter />;
