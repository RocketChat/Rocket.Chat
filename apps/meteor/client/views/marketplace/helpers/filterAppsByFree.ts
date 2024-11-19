import type { App } from '@rocket.chat/core-typings';

export const filterAppsByFree = ({ purchaseType, price, isEnterpriseOnly }: Partial<App>): boolean =>
	purchaseType === 'buy' && !price && !isEnterpriseOnly;
