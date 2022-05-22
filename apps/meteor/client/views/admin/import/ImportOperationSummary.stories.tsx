import { Table } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import ImportOperationSummary from './ImportOperationSummary';

export default {
	title: 'Admin/Import/ImportOperationSummary',
	component: ImportOperationSummary,
	subcomponents: {
		'ImportOperationSummary.Skeleton': ImportOperationSummary.Skeleton,
	},
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(fn) => (
			<Table>
				<Table.Body>{fn()}</Table.Body>
			</Table>
		),
	],
} as ComponentMeta<typeof ImportOperationSummary>;

export const Default: ComponentStory<typeof ImportOperationSummary> = (args) => <ImportOperationSummary {...args} />;

export const Skeleton: ComponentStory<typeof ImportOperationSummary.Skeleton> = (args) => <ImportOperationSummary.Skeleton {...args} />;
