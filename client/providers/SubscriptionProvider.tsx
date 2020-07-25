import React, { useMemo, FC, useCallback } from 'react';

import { SubscriptionContext } from '../contexts/SubscriptionContext';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { Subscriptions } from '../../app/models/client';

export const useUserSubscription = (rid: string, fields: Mongo.Query<any>): Mongo.Collection<any> => useReactiveValue(useCallback(() => Subscriptions.findOne({ rid }, { fields }), [rid, fields]));
export const useUserSubscriptionByName = (name: string, fields: Mongo.Query<any>): Mongo.Collection<any> => useReactiveValue(useCallback(() => Subscriptions.findOne({ name }, { fields }), [name, fields]));


const SubscriptionProvider: FC = ({ children }) => {
	const contextValue = useMemo(() => ({
		useUserSubscription,
		useUserSubscriptionByName,
	}), []);

	return <SubscriptionContext.Provider children={children} value={contextValue} />;
};

export default SubscriptionProvider;
