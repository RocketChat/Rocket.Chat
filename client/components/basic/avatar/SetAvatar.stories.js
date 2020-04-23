import React from 'react';

import { SetAvatar } from './SetAvatar';


export default {
	title: 'directory/table',
	component: SetAvatar,
	decorators: [(fn) => <div children={fn()} style={{ height: '100vh' }} />],
};


export const _default = () => {
	// const Search = () => <Box mb='x16' is='form' display='flex' flexDirection='column'>
	// 	<TextInput placeholder='Search...' addon={<Icon name='magnifier' size='x20'/>}/>
	// </Box>;

	return <SetAvatar />;
};

// export const _default = () => {
// 	const Search = () => <Box mb='x16' is='form' display='flex' flexDirection='column'>
// 		<TextInput placeholder='Search...' addon={<Icon name='magnifier' size='x20'/>}/>
// 	</Box>;


// 	const header = [
// 		<Th>Name</Th>,
// 		<Th>Email</Th>,
// 		<Th>Data</Th>,
// 		<Th>Info</Th>,
// 	];
// 	return <GenericTable FilterComponent={Search} header={header} />;
// };
