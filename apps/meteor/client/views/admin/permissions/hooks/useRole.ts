import type { IRole } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

import { Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const useRole = (_id?: IRole['_id']): IRole => useReactiveValue(useCallback(() => Roles.findOne({ _id }), [_id]));
