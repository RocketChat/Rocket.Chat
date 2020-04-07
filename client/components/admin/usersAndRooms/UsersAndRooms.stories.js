import React from 'react';

import { ServerContext } from '../../../contexts/ServerContext';

import { UsersAndRooms } from '.';


export default {
	title: 'admin/pages/UsersAndRooms',
	component: UsersAndRooms,
};

const usersResult = () => ({
	result: [1, 2, 3, 4, 5, 6].map((num) => ({
		_id: num,
		username: `username - ${ num }`,
		name: `name - ${ num }`,
		emails: [{ address: `email - ${ num }` }],
		roles: [`admin - ${ num }`, `user - ${ num }`],
		status: `Online - ${ num }`,
	})),
	total: 6,
	success: true,
});

const roomsResult = () => ({
	result: [1, 2, 3, 4, 5, 6].map((num) => ({
		_id: num,
		name: `name - ${ num }`,
		users: Math.floor(num * Math.random() * 100),
		type: 'Channel',
		messages: Math.floor(num * Math.random() * 1000),
		default: true,
		featured: true,
	})),
	total: 6,
	success: true,
});

export const _default = () =>
	<ServerContext.Provider value={{ callEndpoint: async (meth, endpoint, args) => (JSON.parse(args.query).type === 'users' ? usersResult() : roomsResult()) }}>
		<UsersAndRooms />
	</ServerContext.Provider>;
