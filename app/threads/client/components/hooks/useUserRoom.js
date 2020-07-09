import { useCallback } from 'react';

import { useReactiveValue } from '../../../../../client/hooks/useReactiveValue';
import { Rooms } from '../../../../models/client';

export const useUserRoom = (rid, fields) =>
	useReactiveValue(useCallback(() => Rooms.findOne({ _id: rid }, { fields }), [rid, fields]));
