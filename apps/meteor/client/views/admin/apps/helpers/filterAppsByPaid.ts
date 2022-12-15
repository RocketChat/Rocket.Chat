import type { App } from '../types';

export const filterAppsByPaid = ({ purchaseType, price, isEnterpriseOnly }: Partial<App>): boolean =>
	purchaseType === 'subscription' || isEnterpriseOnly || Boolean(price);
