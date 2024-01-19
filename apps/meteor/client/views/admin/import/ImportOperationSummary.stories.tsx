import { Table, TableBody } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import ImportOperationSummary from './ImportOperationSummary';
import ImportOperationSummarySkeleton from './ImportOperationSummarySkeleton';

export default {
	title: 'Admin/Import/ImportOperationSummary',
	component: ImportOperationSummary,
	subcomponents: {
		ImportOperationSummarySkeleton,
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
} as ComponentMeta<typeof ImportOperationSummary>;

export const Default: ComponentStory<typeof ImportOperationSummary> = (args) => <ImportOperationSummary {...args} />;

export const Skeleton: ComponentStory<typeof ImportOperationSummarySkeleton> = (args) => <ImportOperationSummarySkeleton {...args} />;
