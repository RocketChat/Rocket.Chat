import React from 'react';
import { TextInput, Box, Icon } from '@rocket.chat/fuselage';

import GenericTable from './GenericTable';


export default {
	title: 'components/GenericTable',
	component: GenericTable,
	decorators: [(fn) => <div children={fn()} style={{ height: '100vh' }} />],
};


export const _default = () => {
	const Search = () => <Box mb='x16' is='form' display='flex' flexDirection='column'>
		<TextInput flexShrink={0} placeholder='Search...' addon={<Icon name='magnifier' size='x20'/>}/>
	</Box>;


	const header = [
		<GenericTable.HeaderCell>Name</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell>Email</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell>Data</GenericTable.HeaderCell>,
		<GenericTable.HeaderCell>Info</GenericTable.HeaderCell>,
	];
	return <GenericTable
		header={header}
		renderFilter={(props) => <Search {...props} />}
	/>;
};
