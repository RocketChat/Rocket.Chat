import { TextInput, Box, Icon } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableCell,
	GenericTableRow,
	GenericTableHeader,
	GenericTableBody,
	GenericTableLoadingTable,
} from '.';
import GenericNoResults from '../GenericNoResults/GenericNoResults';

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

const headers = (
	<>
		<GenericTableHeaderCell key='name'>Name</GenericTableHeaderCell>
		<GenericTableHeaderCell key='email'>Email</GenericTableHeaderCell>
	</>
);

const results = Array.from({ length: 10 }, (_, i) => ({
	_id: i,
	name: `John Doe #${i}`,
	email: `john.doe.n${i}@example.com`,
}));

const filter = (
	<>
		<Box mb={16} is='form' display='flex' flexDirection='column'>
			<TextInput flexShrink={0} placeholder='Search...' addon={<Icon name='magnifier' size='x20' />} />
		</Box>
	</>
);

export const Default: ComponentStory<typeof GenericTable> = () => (
	<>
		{filter}
		<GenericTable>
			<GenericTableHeader>{headers}</GenericTableHeader>
			<GenericTableBody>
				{results?.map(({ _id, name, email }: any) => (
					<GenericTableRow key={_id}>
						<GenericTableCell>{name}</GenericTableCell>
						<GenericTableCell>{email}</GenericTableCell>
					</GenericTableRow>
				))}
			</GenericTableBody>
		</GenericTable>
	</>
);

export const Loading: ComponentStory<typeof GenericTable> = () => (
	<>
		{filter}
		<GenericTable>
			<GenericTableHeader>{headers}</GenericTableHeader>
			<GenericTableBody>
				<GenericTableLoadingTable headerCells={2} />
			</GenericTableBody>
		</GenericTable>
	</>
);

export const NoResults: ComponentStory<typeof GenericTable> = () => (
	<>
		{filter}
		<GenericNoResults />
	</>
);
