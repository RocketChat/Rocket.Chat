import { Table, TableBody } from '@rocket.chat/fuselage';
import type { StoryObj, Meta } from '@storybook/react';
import type { ComponentType } from 'react';

import ImportOperationSummary from './ImportOperationSummary';
import ImportOperationSummarySkeleton from './ImportOperationSummarySkeleton';

export default {
	component: ImportOperationSummary,
	subcomponents: {
		ImportOperationSummarySkeleton: ImportOperationSummarySkeleton as ComponentType<any>,
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(fn) => (
			<Table>
				<TableBody>{fn()}</TableBody>
			</Table>
		),
	],
} satisfies Meta<typeof ImportOperationSummary>;

export const Default: StoryObj<typeof ImportOperationSummary> = {};

export const Skeleton: StoryObj<typeof ImportOperationSummarySkeleton> = {
	render: (args) => <ImportOperationSummarySkeleton {...args} />,
};
