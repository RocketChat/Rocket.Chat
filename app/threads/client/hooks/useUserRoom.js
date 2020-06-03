import { useReactiveValue } from '../../../../client/hooks/useReactiveValue';
import { Rooms } from '../../../models/client';

export default function useUserRoom(rid, fields) {
	return useReactiveValue(() => Rooms.findOne({ _id: rid }, { fields }), [rid, fields]);
}
