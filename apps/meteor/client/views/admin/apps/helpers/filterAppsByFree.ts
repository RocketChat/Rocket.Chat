import { App } from '../types';

export const filterAppsByFree = ({ purchaseType, price }: Partial<App>): boolean => purchaseType === 'buy' && !price;
