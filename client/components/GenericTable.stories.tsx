import { TextInput, Box, Icon } from '@rocket.chat/fuselage';
import { Story } from '@storybook/react';
import React, { ReactElement, ReactNode } from 'react';

import GenericTable from './GenericTable';

export default {
	title: 'components/GenericTable',
	component: GenericTable,
	decorators: [
		(fn: () => ReactNode): ReactElement => <div children={fn()} style={{ height: '100vh' }} />,
	],
};

export const _default: Story = () => {
	const Search = (): ReactElement => (
		<Box mb='x16' is='form' display='flex' flexDirection='column'>
			<TextInput
				flexShrink={0}
				placeholder='Search...'
				addon={<Icon name='magnifier' size='x20' />}
			/>
		</Box>
	);

	const header = [
		<GenericTable.HeaderCell>Name</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell>Email</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell>Data</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell>Info</GenericTable.HeaderCell>,
	];
	return <GenericTable header={header} renderFilter={(): ReactElement => <Search />} />;
};
