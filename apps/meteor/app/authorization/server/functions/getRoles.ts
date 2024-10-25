import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

export const getRoles = async (): Promise<IRole[]> => Roles.find().toArray();

export const getRoleIds = async (): Promise<IRole['_id'][]> =>
	(await Roles.find({}, { projection: { _id: 1 } }).toArray()).map(({ _id }) => _id);
