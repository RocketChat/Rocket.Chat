import type { Meta, StoryFn } from '@storybook/react';

import AppearanceForm from './AppearanceForm';

export default {
	title: 'Omnichannel/AppearanceForm',
	component: AppearanceForm,
} satisfies Meta<typeof AppearanceForm>;

export const Default: StoryFn<typeof AppearanceForm> = () => <AppearanceForm />;
Default.storyName = 'AppearanceForm';
