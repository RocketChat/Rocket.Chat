import { useReactiveValue } from '../../hooks/useReactiveValue';
import { Rooms } from '../../../app/models/client';

export const useUserRoom = (rid, fields) => useReactiveValue(() => Rooms.findOne({ _id: rid }, { fields }), [rid, fields]);
