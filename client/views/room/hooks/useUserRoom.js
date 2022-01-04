import { useCallback } from 'react';

import { Rooms } from '../../../../app/models/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

export const useUserRoom = (rid, fields) => useReactiveValue(useCallback(() => Rooms.findOne({ _id: rid }, { fields }), [rid, fields]));
