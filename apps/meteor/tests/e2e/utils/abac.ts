import type { APIRequestContext } from '@playwright/test';
import type { IAbacAttributeDefinition, IRoom, IUser } from '@rocket.chat/core-typings';
import type { Collection } from 'mongodb';
import { MongoClient } from 'mongodb';

import type { BaseTest } from './test';
import { API_PREFIX, URL_MONGODB } from '../config/constants';

export const createAbacAttribute = async (api: BaseTest['api'], key: string, values: string[]): Promise<string> => {
	const response = await api.post('/abac/attributes', { key, values });

	if (response.status() !== 200) {
		throw new Error(`Failed to create ABAC attribute ${key}.`);
	}

	const { attributes }: { attributes: { _id: string; key: string }[] } = await (await api.get('/abac/attributes', { key })).json();
	const attribute = attributes.find((attribute) => attribute.key === key);

	if (!attribute) {
		throw new Error(`ABAC attribute ${key} not found after creating it.`);
	}

	return attribute._id;
};

export const deleteAbacAttribute = (api: BaseTest['api'], attributeId: string) => api.delete(`/abac/attributes/${attributeId}`);

export const setRoomAbacAttributes = async (api: BaseTest['api'], roomId: string, attributes: Record<string, string[]>): Promise<void> => {
	const response = await api.post(`/abac/rooms/${roomId}/attributes`, { attributes });

	if (response.status() !== 200) {
		throw new Error(`Failed to set ABAC attributes on room ${roomId}.`);
	}
};

const withUsersCollection = async (update: (users: Collection<IUser>) => Promise<unknown>): Promise<void> => {
	const connection = await MongoClient.connect(URL_MONGODB);

	try {
		await update(connection.db().collection<IUser>('users'));
	} finally {
		await connection.close();
	}
};

export const addUserAbacAttributes = (username: string, attributes: IAbacAttributeDefinition[]) =>
	withUsersCollection((users) => users.updateOne({ username }, { $push: { abacAttributes: { $each: attributes } } }));

export const removeUserAbacAttributes = (usernames: string[], keys: string[]) =>
	withUsersCollection((users) => users.updateMany({ username: { $in: usernames } }, { $pull: { abacAttributes: { key: { $in: keys } } } }));

export const getGroupInfo = async (memberApi: APIRequestContext, roomName: string): Promise<IRoom> => {
	const response = await memberApi.get(`${API_PREFIX}/groups.info`, { params: { roomName } });

	if (response.status() !== 200) {
		throw new Error(`Failed to get group ${roomName}.`);
	}

	const { group }: { group: IRoom } = await response.json();

	return group;
};

export const getGroupMemberUsernames = async (memberApi: APIRequestContext, roomId: string): Promise<string[]> => {
	const response = await memberApi.get(`${API_PREFIX}/groups.members`, { params: { roomId } });

	if (response.status() !== 200) {
		throw new Error(`Failed to list the members of group ${roomId}.`);
	}

	const { members }: { members: Pick<IUser, 'username'>[] } = await response.json();

	return members.flatMap(({ username }) => (username ? [username] : []));
};
