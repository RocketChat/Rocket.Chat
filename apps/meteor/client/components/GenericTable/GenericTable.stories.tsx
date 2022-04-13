import { TextInput, Box, Icon, Table } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import GenericTable from '.';

export default {
	title: 'Components/GenericTable',
	component: GenericTable,
	parameters: {
		layout: 'padded',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [
		(fn) => <div style={{ height: '100vh', maxHeight: 300, display: 'flex', flexDirection: 'column', marginInline: 24 }}>{fn()}</div>,
	],
} as ComponentMeta<typeof GenericTable>;

const header = [
	<GenericTable.HeaderCell key='name'>Name</GenericTable.HeaderCell>,
	<GenericTable.HeaderCell key='email'>Email</GenericTable.HeaderCell>,
];

const renderFilter = () => (
	<Box mb='x16' is='form' display='flex' flexDirection='column'>
		<TextInput flexShrink={0} placeholder='Search...' addon={<Icon name='magnifier' size='x20' />} />
	</Box>
);

const renderRow = ({ _id, name, email }: any) => (
	<Table.Row key={_id}>
		<Table.Cell>{name}</Table.Cell>
		<Table.Cell>{email}</Table.Cell>
	</Table.Row>
);

export const Default: ComponentStory<typeof GenericTable> = (args) => (
	<GenericTable {...args} header={header} renderFilter={renderFilter} renderRow={renderRow} height='100vh' />
);
Default.storyName = 'GenericTable';
Default.args = {
	results: Array.from({ length: 10 }, (_, i) => ({
		_id: i,
		name: `John Doe #${i}`,
		email: `john.doe.n${i}@example.com`,
	})),
	total: 1,
};
