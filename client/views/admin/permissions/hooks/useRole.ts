import { useCallback } from 'react';

import { Roles } from '../../../../../app/models/client';
import { IRole } from '../../../../../definition/IRole';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const useRole = (_id?: IRole['_id']): IRole => useReactiveValue(useCallback(() => Roles.findOne({ _id }), [_id]));
