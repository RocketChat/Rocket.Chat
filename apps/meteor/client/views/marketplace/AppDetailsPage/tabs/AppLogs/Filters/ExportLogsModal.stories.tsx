import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentProps } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { ExportLogsModal } from './ExportLogsModal';

export default {
	title: 'Marketplace/AppDetailsPage/AppLogs/Filters/ExportLogsModal',
	component: ExportLogsModal,
	args: {
		onClose: action('onClose'),
		filterValues: {
			severity: 'all',
			event: '',
			startDate: '',
			endDate: '',
		},
	},
	decorators: [
		mockAppRoot().buildStoryDecorator(),
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
} satisfies Meta<typeof ExportLogsModal>;

export const Default: StoryFn<ComponentProps<typeof ExportLogsModal>> = (args) => <ExportLogsModal {...args} />;
