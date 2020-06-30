import { useReactiveValue } from '../../../../../client/hooks/useReactiveValue';
import { Subscriptions } from '../../../../models/client';

export const useUserSubscription = (rid, fields) => useReactiveValue(() => Subscriptions.findOne({ rid }, { fields }), [rid, fields]);
