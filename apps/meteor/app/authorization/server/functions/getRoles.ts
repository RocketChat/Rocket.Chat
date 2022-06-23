import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

export const getRoles = (): IRole[] => Promise.await(Roles.find().toArray());
