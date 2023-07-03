import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Contextualbar } from '../../../../components/Contextualbar';
import PruneMessages from './PruneMessages';

export default {
	title: 'Room/Contextual Bar/PruneMessages',
	component: PruneMessages,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} as ComponentMeta<typeof PruneMessages>;

const Template: ComponentStory<typeof PruneMessages> = (args) => {
	const methods = useForm({
		defaultValues: {
			pinned: true,
		},
	});

	return (
		<FormProvider {...methods}>
			<PruneMessages {...args} />
		</FormProvider>
	);
};

export const Default = Template.bind({});

export const WithCallout = Template.bind({});
WithCallout.args = {
	callOutText: 'This is a callout',
};
