import { useReactiveValue } from '../../hooks/useReactiveValue';
import { Subscriptions } from '../../../app/models/client';

export const useUserSubscription = (rid, fields) => useReactiveValue(() => Subscriptions.findOne({ rid }, { fields }), [rid, fields]);
