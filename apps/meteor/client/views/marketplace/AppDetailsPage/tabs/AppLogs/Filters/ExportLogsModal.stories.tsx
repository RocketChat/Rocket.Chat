import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { StoryObj, Meta } from '@storybook/react';
import type { ComponentProps } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { action } from 'storybook/actions';

import { ExportLogsModal } from './ExportLogsModal';

export default {
	component: ExportLogsModal,
	args: {
		onClose: action('onClose'),
		filterValues: {
			severity: 'all',
			event: '',
			startDate: '',
			endDate: '',
		},
		onConfirm: () => action('onConfirm'),
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

export const Default: StoryObj<ComponentProps<typeof ExportLogsModal>> = {};
