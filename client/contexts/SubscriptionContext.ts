import { createContext, useContext } from 'react';

type SubscriptionContextValue = {
	useUserSubscription: (rid: string, fields: Mongo.Query<any>) => any;
	useUserSubscriptionByName: (name: string, fields: Mongo.Query<any>) => any;
};

export const SubscriptionContext = createContext<SubscriptionContextValue>({
	useUserSubscription: () => ({}),
	useUserSubscriptionByName: () => ({}),
});

export const useUserSubscription = (rid: string, fields: Mongo.Query<any>): Mongo.Collection<any> => useContext(SubscriptionContext).useUserSubscription(rid, fields);
export const useUserSubscriptionByName = (name: string, fields: Mongo.Query<any>): Mongo.Collection<any> => useContext(SubscriptionContext).useUserSubscriptionByName(name, fields);
