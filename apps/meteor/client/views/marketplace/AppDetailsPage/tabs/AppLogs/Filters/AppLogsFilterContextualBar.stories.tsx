import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/react';
import { FormProvider, useForm } from 'react-hook-form';

import { AppLogsFilterContextualBar } from './AppLogsFilterContextualBar';
import { Contextualbar } from '../../../../../../components/Contextualbar';

export default {
	title: 'Marketplace/AppDetailsPage/AppLogs/Filters/AppLogsFilterContextualBar',
	component: AppLogsFilterContextualBar,
	args: {},
	decorators: [
		mockAppRoot()
			// @ts-expect-error The endpoint is to be merged in https://github.com/RocketChat/Rocket.Chat/pull/36245
			.withEndpoint('GET', '/apps/logs/instanceIds', () => ({
				success: true,
				instanceIds: ['instance-1', 'instance-2', 'instance-3'],
			}))
			.buildStoryDecorator(),
		(fn) => {
			const methods = useForm({});

			return (
				<FormProvider {...methods}>
					<Contextualbar height='100vh'>{fn()}</Contextualbar>
				</FormProvider>
			);
		},
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof AppLogsFilterContextualBar>;

export const Default = () => <AppLogsFilterContextualBar onClose={action('onClose')} />;
