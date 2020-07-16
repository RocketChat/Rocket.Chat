import { useCallback } from 'react';

import { useReactiveValue } from '../../hooks/useReactiveValue';
import { Subscriptions } from '../../../app/models/client';

export const useUserSubscription = (rid, fields) => useReactiveValue(useCallback(() => Subscriptions.findOne({ rid }, { fields }), [rid, fields]));
