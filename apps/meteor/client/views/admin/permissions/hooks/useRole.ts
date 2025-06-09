import type { IRole } from '@rocket.chat/core-typings';

import { Roles } from '../../../../../app/models/client';

export const useRole = (_id?: IRole['_id']) => Roles.use((state) => (_id ? state.get(_id) : undefined));
