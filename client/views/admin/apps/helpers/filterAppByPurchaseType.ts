import { App } from '../types';

export const filterAppByPurchaseType = (apps: App[], purchaseType: string): App[] =>
	purchaseType === 'paid'
		? apps.filter((app) => app.purchaseType === 'subscription' || app.price)
		: apps.filter((app) => app.purchaseType === 'buy' && !app.price);
