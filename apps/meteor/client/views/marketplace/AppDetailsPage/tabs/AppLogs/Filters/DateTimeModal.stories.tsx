import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentProps } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { DateTimeModal } from './DateTimeModal';

export default {
	title: 'Marketplace/AppDetailsPage/AppLogs/Filters/DateTimeModal',
	component: DateTimeModal,
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
} satisfies Meta<typeof DateTimeModal>;

export const Default: StoryFn<ComponentProps<typeof DateTimeModal>> = () => (
	<DateTimeModal onClose={action('onClose')} onSave={action('onSave')} />
);
