import type { IRole } from '@rocket.chat/core-typings';

import { Roles } from '../../../../stores';

export const useRole = (_id?: IRole['_id']) => Roles.useStore((state) => (_id ? state.get(_id) : undefined));
