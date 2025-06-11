import type { Meta, StoryFn } from '@storybook/react';

import { OutboundMessageWizard } from './OutboundMessageWizard';

export default {
	title: 'Components/OutboundMessageWizard',
	component: OutboundMessageWizard,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof OutboundMessageWizard>;

export const Example: StoryFn<typeof OutboundMessageWizard> = () => <OutboundMessageWizard />;
