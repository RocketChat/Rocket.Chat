import React from 'react';

import { DirectoryTable, Th } from './DirectoryTable';

export default {
	title: 'directory/table',
	component: DirectoryTable,
	decorators: [(fn) => <div children={fn()} style={{ height: '100vh' }} />],
};

export const _default = () => {
	const header = [
		<Th>Name</Th>,
		<Th>Email</Th>,
		<Th>Data</Th>,
		<Th>Info</Th>,
	];
	return <DirectoryTable header={header} />;
};
