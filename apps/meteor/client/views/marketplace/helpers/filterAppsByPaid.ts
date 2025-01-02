import type { App } from '@rocket.chat/core-typings';

export const filterAppsByPaid = ({ purchaseType, price }: Partial<App>): boolean => purchaseType === 'subscription' || Boolean(price);
