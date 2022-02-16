import { App } from '../types';

export const filterAppByPurchaseType = (apps: App[], purchaseType: string): App[] => {
	const isSubscription = (app: App): boolean => app.purchaseType === 'subscription' || Boolean(app.price);
	const isBuy = (app: App): boolean => app.purchaseType === 'buy' && !app.price;

	return purchaseType === 'paid' ? apps.filter((app) => isSubscription(app)) : apps.filter((app) => isBuy(app));
};
