import type { Meta, StoryObj } from '@storybook/react';

import TextSeparator from './TextSeparator';

export default {
	component: TextSeparator,
	parameters: {
		layout: 'centered',
	},
	decorators: [(fn) => <div style={{ minWidth: 400 }}>{fn()}</div>],
} satisfies Meta<typeof TextSeparator>;

export const Default: StoryObj<typeof TextSeparator> = {
	name: 'TextSeparator',
	args: {
		label: 'Example label',
		value: 'Example value',
	},
};
