import { useCallback } from 'react';

import { useReactiveValue } from '../../../../../client/hooks/useReactiveValue';
import { Subscriptions } from '../../../../models/client';

export const useUserSubscription = (rid, fields) =>
	useReactiveValue(useCallback(() => Subscriptions.findOne({ rid }, { fields }), [rid, fields]));
