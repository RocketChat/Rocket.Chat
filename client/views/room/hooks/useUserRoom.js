import { useCallback } from 'react';

import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { Rooms } from '../../../../app/models/client';

export const useUserRoom = (rid, fields) => useReactiveValue(useCallback(() => Rooms.findOne({ _id: rid }, { fields }), [rid, fields]));
