import type { IRole } from '@rocket.chat/core-typings';
import { useStore } from 'zustand';

import { Roles } from '../../../../stores';

export const useRole = (_id?: IRole['_id']) => useStore(Roles.use, (state) => (_id ? state.get(_id) : undefined));
