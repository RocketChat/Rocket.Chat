import type { StoryObj, Meta } from '@storybook/react';

import Installation from './Installation';

export default {
	component: Installation,
} satisfies Meta<typeof Installation>;

export const Default: StoryObj<typeof Installation> = {
	render: () => <Installation />,
	name: 'Installation',
};
