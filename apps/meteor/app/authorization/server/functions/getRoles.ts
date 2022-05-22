import type { IRole } from '@rocket.chat/core-typings';

import { Roles } from '../../../models/server/raw';

export const getRoles = (): IRole[] => Promise.await(Roles.find().toArray());
