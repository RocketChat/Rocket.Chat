import React from 'react';
import { TextInput, Box, Icon } from '@rocket.chat/fuselage';

import { GenericTable, Th } from './GenericTable';


export default {
	title: 'directory/table',
	component: GenericTable,
	decorators: [(fn) => <div children={fn()} style={{ height: '100vh' }} />],
};


export const _default = () => {
	const Search = () => <Box mb='x16' is='form' display='flex' flexDirection='column'>
		<TextInput flexShrink={0} placeholder='Search...' addon={<Icon name='magnifier' size='x20'/>}/>
	</Box>;


	const header = [
		<Th>Name</Th>,
		<Th>Email</Th>,
		<Th>Data</Th>,
		<Th>Info</Th>,
	];
	return <GenericTable FilterComponent={Search} header={header} />;
};
