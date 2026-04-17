import { mockAppRoot } from '@rocket.chat/mock-providers';
import { Contextualbar } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import { AppLogsFilterContextualBar } from './AppLogsFilterContextualBar';

export default {
	component: AppLogsFilterContextualBar,
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
			const methods = useForm({
				defaultValues: {
					instanceId: 'instance-1',
					method: 'method-1',
					severity: 'all',
					event: 'all',
					startDate: '',
					endDate: '',
					startTime: '',
					endTime: '',
				},
			});

			return (
				<FormProvider {...methods}>
					<Contextualbar height='100vh'> {fn()}</Contextualbar>
				</FormProvider>
			);
		},
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof AppLogsFilterContextualBar>;

export const Default = () => <AppLogsFilterContextualBar appId='app-id' onClose={action('onClose')} />;
