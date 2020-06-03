import { useReactiveValue } from '../../../../client/hooks/useReactiveValue';
import { Subscriptions } from '../../../models/client';

export default function useUserSubscription(rid, fields) {
	return useReactiveValue(() => Subscriptions.findOne({ rid }, { fields }), [rid, fields]);
}
