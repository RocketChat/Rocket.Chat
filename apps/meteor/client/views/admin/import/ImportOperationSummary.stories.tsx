import { Table, TableBody } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentType } from 'react';

import ImportOperationSummary from './ImportOperationSummary';
import ImportOperationSummarySkeleton from './ImportOperationSummarySkeleton';

export default {
	title: 'Admin/Import/ImportOperationSummary',
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

export const Default: StoryFn<typeof ImportOperationSummary> = (args) => <ImportOperationSummary {...args} />;

export const Skeleton: StoryFn<typeof ImportOperationSummarySkeleton> = (args) => <ImportOperationSummarySkeleton {...args} />;
