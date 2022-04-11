import { useCallback } from 'react';

import { Roles } from '../../../../app/models/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

export const useRole = (_id) => useReactiveValue(useCallback(() => Roles.findOne({ _id }), [_id]));
