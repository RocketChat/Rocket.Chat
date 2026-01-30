import type { Meta, StoryFn } from '@storybook/react';

import Installation from './Installation';

export default {
	component: Installation,
} satisfies Meta<typeof Installation>;

export const Default: StoryFn<typeof Installation> = () => <Installation />;
Default.storyName = 'Installation';
